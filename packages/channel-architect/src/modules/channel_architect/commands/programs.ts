import { randomUUID } from 'node:crypto'
import { registerCommand } from '@open-mercato/shared/lib/commands'
import type { CommandHandler } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import { CrudHttpError, notFound } from '@open-mercato/shared/lib/crud/errors'
import { withAtomicFlush } from '@open-mercato/shared/lib/commands/flush'
import { generateDesign, validateDesignInputs, DESIGN_ENGINE_VERSION } from '../lib/designEngine'
import {
  ChannelArchitectProgram,
  ChannelArchitectProgramReview,
  ChannelArchitectProgramVersion,
} from '../data/entities'
import {
  programCreateSchema,
  programRevisionSchema,
  programReviewSchema,
} from '../data/validators'
import { ensureOrganizationScope, ensureTenantScope } from './scope'

type ProgramScope = { tenantId: string; organizationId: string }
type CreateProgramInput = ProgramScope & { name: string; scenario: unknown; settings: unknown }
type ReviseProgramInput = ProgramScope & { programId: string; expectedVersion: number; scenario: unknown; settings: unknown }
type ReviewProgramInput = ProgramScope & { programVersionId: string; decision: 'approved' | 'rejected'; rationale: string }

const createProgram: CommandHandler<CreateProgramInput, { programId: string; versionId: string; version: number }> = {
  id: 'channel_architect.programs.create',
  async execute(raw, ctx) {
    const parsed = programCreateSchema.parse(raw)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const errors = validateDesignInputs(parsed.scenario, parsed.settings)
    if (errors.length) throw new CrudHttpError(400, { error: errors.join(' ') })

    const actorId = ctx.auth?.sub
    if (!actorId) throw new CrudHttpError(401, { error: 'Authenticated actor is required.' })
    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const outputSnapshot = generateDesign(parsed.scenario, parsed.settings)
    const program = em.create(ChannelArchitectProgram, {
      id: randomUUID(),
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      name: parsed.name,
      ownerUserId: actorId,
      createdBy: actorId,
      currentVersionNumber: 1,
    })
    const version = em.create(ChannelArchitectProgramVersion, {
      id: randomUUID(),
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      programId: program.id,
      versionNumber: 1,
      scenarioSnapshot: parsed.scenario,
      settingsSnapshot: parsed.settings,
      outputSnapshot,
      engineVersion: DESIGN_ENGINE_VERSION,
      createdBy: actorId,
    })

    await withAtomicFlush(em, [async () => { em.persist([program, version]) }], { transaction: true })
    return { programId: program.id, versionId: version.id, version: 1 }
  },
}

const reviseProgram: CommandHandler<ReviseProgramInput, { versionId: string; version: number }> = {
  id: 'channel_architect.programs.revise',
  async execute(raw, ctx) {
    const parsed = programRevisionSchema.parse(raw)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const errors = validateDesignInputs(parsed.scenario, parsed.settings)
    if (errors.length) throw new CrudHttpError(400, { error: errors.join(' ') })
    const actorId = ctx.auth?.sub
    if (!actorId) throw new CrudHttpError(401, { error: 'Authenticated actor is required.' })

    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const program = await em.findOne(ChannelArchitectProgram, {
      id: raw.programId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
    })
    if (!program) throw notFound('Program not found')
    const nextVersion = parsed.expectedVersion + 1
    const version = em.create(ChannelArchitectProgramVersion, {
      id: randomUUID(),
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      programId: program.id,
      versionNumber: nextVersion,
      scenarioSnapshot: parsed.scenario,
      settingsSnapshot: parsed.settings,
      outputSnapshot: generateDesign(parsed.scenario, parsed.settings),
      engineVersion: DESIGN_ENGINE_VERSION,
      createdBy: actorId,
    })

    await withAtomicFlush(em, [async () => {
      const updated = await em.nativeUpdate(ChannelArchitectProgram, {
        id: program.id,
        tenantId: raw.tenantId,
        organizationId: raw.organizationId,
        currentVersionNumber: parsed.expectedVersion,
      }, { currentVersionNumber: nextVersion, updatedAt: new Date() })
      if (updated !== 1) throw new CrudHttpError(409, { error: 'Program changed. Reload the latest version before revising.' })
      em.persist(version)
    }], { transaction: true })
    return { versionId: version.id, version: nextVersion }
  },
}

const reviewProgram: CommandHandler<ReviewProgramInput, { reviewId: string }> = {
  id: 'channel_architect.programs.review',
  async execute(raw, ctx) {
    const parsed = programReviewSchema.parse(raw)
    ensureTenantScope(ctx, raw.tenantId)
    ensureOrganizationScope(ctx, raw.organizationId)
    const actorId = ctx.auth?.sub
    if (!actorId) throw new CrudHttpError(401, { error: 'Authenticated reviewer is required.' })
    const em = (ctx.container.resolve('em') as EntityManager).fork()
    const version = await em.findOne(ChannelArchitectProgramVersion, {
      id: raw.programVersionId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
    })
    if (!version) throw notFound('Program version not found')
    const program = await em.findOne(ChannelArchitectProgram, {
      id: version.programId,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
    })
    if (!program) throw notFound('Program not found')
    if (program.ownerUserId === actorId || version.createdBy === actorId) {
      throw new CrudHttpError(403, { error: 'The program owner or version creator cannot review their own version.' })
    }
    const existing = await em.findOne(ChannelArchitectProgramReview, {
      programVersionId: version.id,
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
    })
    if (existing) throw new CrudHttpError(409, { error: 'This version already has a final review decision.' })

    const review = em.create(ChannelArchitectProgramReview, {
      id: randomUUID(),
      tenantId: raw.tenantId,
      organizationId: raw.organizationId,
      programVersionId: version.id,
      decision: parsed.decision,
      rationale: parsed.rationale,
      reviewerUserId: actorId,
    })
    await withAtomicFlush(em, [async () => { em.persist(review) }], { transaction: true })
    return { reviewId: review.id }
  },
}

registerCommand(createProgram)
registerCommand(reviseProgram)
registerCommand(reviewProgram)

export { createProgram, reviseProgram, reviewProgram }
