import { randomUUID } from 'node:crypto'
import { LockMode } from '@mikro-orm/core'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import { CrudHttpError, notFound } from '@open-mercato/shared/lib/crud/errors'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import {
  ChannelArchitectPilot,
  ChannelArchitectPilotCheckpoint,
  ChannelArchitectProgram,
  ChannelArchitectProgramReview,
  ChannelArchitectProgramVersion,
} from '../data/entities'
import {
  pilotCheckpointUpdateSchema,
  pilotCreateSchema,
  pilotStatusUpdateSchema,
} from '../data/validators'
import { ensureOrganizationScope, ensureTenantScope } from './scope'

type PilotScope = { tenantId: string; organizationId: string }
type CreatePilotInput = PilotScope & { input: unknown }
type UpdatePilotInput = PilotScope & { pilotId: string; input: unknown }
type UpdateCheckpointInput = PilotScope & { pilotId: string; checkpointId: string; input: unknown }

const createPilot: CommandHandler<CreatePilotInput, { pilotId: string; checkpointIds: string[] }> = {
  id: 'channel_architect.pilots.create',
  async execute(raw, ctx) {
    const parsed = pilotCreateSchema.parse(raw.input)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const actorId = ctx.auth?.sub
    if (!actorId) throw new CrudHttpError(401, { error: 'Authenticated pilot owner is required.' })

    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const version = await em.findOne(ChannelArchitectProgramVersion, {
      id: parsed.programVersionId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
    })
    if (!version) throw notFound('Approved program version not found')

    const [program, review] = await Promise.all([
      em.findOne(ChannelArchitectProgram, {
        id: version.programId,
        tenantId: raw.tenantId,
        organizationId: raw.organizationId,
      }),
      em.findOne(ChannelArchitectProgramReview, {
        programVersionId: version.id,
        tenantId: raw.tenantId,
        organizationId: raw.organizationId,
      }),
    ])
    if (!program) throw notFound('Program not found')
    if (program.status === 'archived') throw new CrudHttpError(409, { error: 'Archived programs cannot start new pilots.' })
    if (!review || review.decision !== 'approved') {
      throw new CrudHttpError(409, { error: 'A pilot can only start from an approved program version.' })
    }
    if (program.currentVersionNumber !== version.versionNumber) {
      throw new CrudHttpError(409, { error: 'Approve the current program version before starting a pilot.' })
    }

    const pilotId = randomUUID()
    const pilot = em.create(ChannelArchitectPilot, {
      id: pilotId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      programVersionId: version.id,
      name: parsed.name,
      cohortLabel: parsed.cohortLabel,
      ownerUserId: actorId,
      status: 'planned',
      targetStartDate: new Date(`${parsed.targetStartDate}T00:00:00.000Z`),
      targetEndDate: parsed.targetEndDate ? new Date(`${parsed.targetEndDate}T00:00:00.000Z`) : null,
      outcome: null,
      createdBy: actorId,
    })
    const checkpoints = parsed.checkpoints.map((checkpoint, index) => em.create(ChannelArchitectPilotCheckpoint, {
      id: randomUUID(),
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      pilotId,
      sortOrder: index + 1,
      title: checkpoint.title,
      dueDate: new Date(`${checkpoint.dueDate}T00:00:00.000Z`),
      status: 'planned',
    }))

    await withAtomicFlush(em, [async () => {
      const currentProgram = await em.findOne(ChannelArchitectProgram, {
        id: program.id,
        tenantId: raw.tenantId,
        organizationId: raw.organizationId,
      }, { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true })
      if (!currentProgram) throw notFound('Program not found')
      if (currentProgram.status === 'archived') throw new CrudHttpError(409, { error: 'The program was archived while the pilot was being created.' })
      if (currentProgram.currentVersionNumber !== version.versionNumber) {
        throw new CrudHttpError(409, { error: 'The program changed while the pilot was being created. Approve its current version and try again.' })
      }
      em.persist([pilot, ...checkpoints])
    }], { transaction: true })
    return { pilotId, checkpointIds: checkpoints.map((checkpoint) => checkpoint.id) }
  },
}

const updatePilotStatus: CommandHandler<UpdatePilotInput, { pilotId: string; status: string; outcome: string | null }> = {
  id: 'channel_architect.pilots.update_status',
  async execute(raw, ctx) {
    const parsed = pilotStatusUpdateSchema.parse(raw.input)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const pilot = await em.findOne(ChannelArchitectPilot, {
      id: raw.pilotId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      deletedAt: null,
    })
    if (!pilot) throw notFound('Pilot not found')

    const allowed: Record<ChannelArchitectPilot['status'], string[]> = {
      planned: ['active', 'cancelled'],
      active: ['paused', 'completed', 'cancelled'],
      paused: ['active', 'cancelled'],
      completed: [],
      cancelled: [],
    }
    if (!allowed[pilot.status].includes(parsed.status)) {
      throw new CrudHttpError(409, { error: `A pilot cannot move from ${pilot.status} to ${parsed.status}.` })
    }
    if (parsed.status === 'completed') {
      const unresolved = await em.count(ChannelArchitectPilotCheckpoint, {
        pilotId: pilot.id,
        tenantId: raw.tenantId,
        organizationId: raw.organizationId,
        status: 'planned',
        deletedAt: null,
      })
      if (unresolved > 0) throw new CrudHttpError(409, { error: 'Complete or skip every checkpoint before recording the pilot outcome.' })
    }
    const outcome = parsed.status === 'completed' ? parsed.outcome! : null
    const updated = await em.nativeUpdate(ChannelArchitectPilot, {
      id: pilot.id,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      status: pilot.status,
      deletedAt: null,
    }, { status: parsed.status, outcome, updatedAt: new Date() })
    if (updated !== 1) throw new CrudHttpError(409, { error: 'Pilot changed. Reload it before updating its status.' })
    return { pilotId: pilot.id, status: parsed.status, outcome }
  },
}

const updatePilotCheckpoint: CommandHandler<UpdateCheckpointInput, { checkpointId: string; status: string }> = {
  id: 'channel_architect.pilots.update_checkpoint',
  async execute(raw, ctx) {
    const parsed = pilotCheckpointUpdateSchema.parse(raw.input)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const pilot = await em.findOne(ChannelArchitectPilot, {
      id: raw.pilotId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      deletedAt: null,
    })
    if (!pilot) throw notFound('Pilot not found')
    if (pilot.status !== 'active' && pilot.status !== 'paused') {
      throw new CrudHttpError(409, { error: 'Checkpoints can only be updated while a pilot is active or paused.' })
    }
    const checkpoint = await em.findOne(ChannelArchitectPilotCheckpoint, {
      id: raw.checkpointId,
      pilotId: pilot.id,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      deletedAt: null,
    })
    if (!checkpoint) throw notFound('Pilot checkpoint not found')
    if (checkpoint.status !== 'planned') {
      throw new CrudHttpError(409, { error: 'This checkpoint already has a final status.' })
    }
    const updated = await em.nativeUpdate(ChannelArchitectPilotCheckpoint, {
      id: checkpoint.id,
      pilotId: pilot.id,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      status: 'planned',
      deletedAt: null,
    }, {
      status: parsed.status,
      completedAt: parsed.status === 'completed' ? new Date() : null,
      updatedAt: new Date(),
    })
    if (updated !== 1) throw new CrudHttpError(409, { error: 'Checkpoint changed. Reload the pilot before updating it.' })
    return { checkpointId: checkpoint.id, status: parsed.status }
  },
}

registerCommand(createPilot)
registerCommand(updatePilotStatus)
registerCommand(updatePilotCheckpoint)

export { createPilot, updatePilotStatus, updatePilotCheckpoint }
