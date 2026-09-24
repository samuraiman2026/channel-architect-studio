import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { archiveProgram, createProgram, reviseProgram, reviewProgram } from '../src/modules/channel_architect/commands/programs'
import { createPilot, updatePilotCheckpoint, updatePilotStatus } from '../src/modules/channel_architect/commands/pilots'
import {
  ChannelArchitectProgram,
  ChannelArchitectPilot,
  ChannelArchitectPilotCheckpoint,
  ChannelArchitectProgramReview,
  ChannelArchitectProgramVersion,
} from '../src/modules/channel_architect/data/entities'
import { SCENARIO_LIST } from '../src/modules/channel_architect/lib/scenarios'

function programState(overrides: Record<string, unknown> = {}) {
  return {
    id: 'program-1',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    status: 'active',
    currentVersionNumber: 3,
    isActive: true,
    deletedAt: null,
    ...overrides,
  }
}

function commandContext(
  state: ReturnType<typeof programState>,
  afterRead?: () => void,
  actorId: string | null = 'user-1',
  options: { versionNumber?: number; versionCreator?: string; reviews?: Record<string, unknown>[] } = {},
) {
  const version = {
    id: 'version-1',
    programId: state.id,
    tenantId: state.tenantId,
    organizationId: state.organizationId,
    versionNumber: options.versionNumber ?? state.currentVersionNumber,
    createdBy: options.versionCreator ?? 'author-1',
    isActive: true,
    deletedAt: null,
  }
  const reviews = options.reviews ?? []
  const em = {
    fork() { return this },
    async findOne(entity: unknown, where: Record<string, unknown>) {
      if (entity === ChannelArchitectProgram && where.id === state.id) {
        const snapshot = { ...state }
        afterRead?.()
        return snapshot
      }
      if (entity === ChannelArchitectProgramVersion && where.id === version.id) return version
      if (entity === ChannelArchitectProgramReview) {
        return reviews.find((review) => review.programVersionId === where.programVersionId) ?? null
      }
      return null
    },
    async nativeUpdate(entity: unknown, where: Record<string, unknown>, changes: Record<string, unknown>) {
      if (entity !== ChannelArchitectProgram) return 0
      const matches = Object.entries(where).every(([key, value]) => state[key as keyof typeof state] === value)
      if (!matches) return 0
      Object.assign(state, changes)
      return 1
    },
    async begin() {},
    async commit() {},
    async rollback() {},
    async flush() {},
    create(entity: unknown, data: Record<string, unknown>) { return { ...data, entity } },
    persist(value: unknown) {
      if (value && typeof value === 'object' && 'entity' in value && value.entity === ChannelArchitectProgramReview) {
        reviews.push(value as Record<string, unknown>)
      }
    },
  }
  return {
    auth: { tenantId: 'tenant-1', sub: actorId },
    selectedOrganizationId: 'org-1',
    organizationIds: ['org-1'],
    container: { resolve: () => em },
  } as never
}

function pilotCommandContext(options: {
  actorId?: string | null
  programStatus?: string
  currentVersionNumber?: number
  reviewDecision?: 'approved' | 'rejected' | null
  nextVersionAfterInitialRead?: number
  pilot?: Record<string, unknown>
  checkpoints?: Record<string, unknown>[]
} = {}) {
  const program = {
    id: 'program-1', status: options.programStatus ?? 'active', currentVersionNumber: options.currentVersionNumber ?? 1,
    tenantId: 'tenant-1', organizationId: 'org-1', isActive: true, deletedAt: null,
  }
  const version = {
    id: 'a5892d87-b14c-4595-9e69-2b289c0cc610', programId: program.id, versionNumber: 1,
    tenantId: 'tenant-1', organizationId: 'org-1', isActive: true, deletedAt: null,
  }
  const review = options.reviewDecision ? {
    id: 'review-1', programVersionId: version.id, decision: options.reviewDecision,
    tenantId: 'tenant-1', organizationId: 'org-1', isActive: true, deletedAt: null,
  } : null
  const pilot = options.pilot ?? {
    id: 'pilot-1', tenantId: 'tenant-1', organizationId: 'org-1', status: 'active',
    isActive: true, deletedAt: null, outcome: null,
  }
  const checkpoints = options.checkpoints ?? []
  const persisted: unknown[] = []
  let programReads = 0
  const em = {
    fork() { return this },
    async findOne(entity: unknown, where: Record<string, unknown>) {
      if (entity === ChannelArchitectProgramVersion) return where.id === version.id ? version : null
      if (entity === ChannelArchitectProgramReview) return review && where.programVersionId === version.id ? review : null
      if (entity === ChannelArchitectProgram) {
        programReads += 1
        if (programReads === 1) {
          const snapshot = { ...program }
          if (options.nextVersionAfterInitialRead !== undefined) {
            program.currentVersionNumber = options.nextVersionAfterInitialRead
          }
          return snapshot
        }
        return { ...program }
      }
      if (entity === ChannelArchitectPilot) {
        return where.id === pilot.id && (!where.status || where.status === pilot.status) ? pilot : null
      }
      if (entity === ChannelArchitectPilotCheckpoint) {
        return checkpoints.find((checkpoint) => checkpoint.id === where.id && checkpoint.pilotId === where.pilotId) ?? null
      }
      return null
    },
    async find(entity: unknown, where: Record<string, unknown>) {
      if (entity !== ChannelArchitectPilotCheckpoint) return []
      return checkpoints.filter((checkpoint) => checkpoint.pilotId === where.pilotId)
    },
    async nativeUpdate(entity: unknown, where: Record<string, unknown>, changes: Record<string, unknown>) {
      const target = entity === ChannelArchitectProgram ? program
        : entity === ChannelArchitectPilot ? pilot
          : entity === ChannelArchitectPilotCheckpoint ? checkpoints.find((checkpoint) => checkpoint.id === where.id)
            : null
      if (!target) return 0
      const targetRecord = target as Record<string, unknown>
      const matches = Object.entries(where).every(([key, value]) => targetRecord[key] === value)
      if (!matches) return 0
      Object.assign(target, changes)
      return 1
    },
    async begin() {}, async commit() {}, async rollback() {}, async flush() {},
    create(_entity: unknown, data: Record<string, unknown>) { return { ...data } },
    persist(value: unknown) {
      if (Array.isArray(value)) persisted.push(...value)
      else persisted.push(value)
    },
  }
  const runtime = {
    auth: { tenantId: 'tenant-1', sub: options.actorId === undefined ? 'user-1' : options.actorId },
    selectedOrganizationId: 'org-1', organizationIds: ['org-1'],
    container: { resolve: () => em },
  } as never
  return { runtime, persisted }
}

describe('Open Mercato lifecycle commands', () => {
  it('archives without changing the current version', async () => {
    const state = programState()
    const result = await archiveProgram.execute({
      programId: 'program-1', tenantId: 'tenant-1', organizationId: 'org-1', expectedVersion: 3,
    }, commandContext(state))

    assert.deepEqual(result, { programId: 'program-1', status: 'archived' })
    assert.equal(state.status, 'archived')
    assert.equal(state.currentVersionNumber, 3)
  })

  it('rejects an archive if a revision wins the version compare-and-set', async () => {
    const state = programState()
    await assert.rejects(
      async () => archiveProgram.execute({
        programId: 'program-1', tenantId: 'tenant-1', organizationId: 'org-1', expectedVersion: 3,
      }, commandContext(state, () => { state.currentVersionNumber = 4 })),
      /Program changed before it could be archived/,
    )
    assert.equal(state.status, 'active')
    assert.equal(state.currentVersionNumber, 4)
  })

  it('does not archive a program twice', async () => {
    const state = programState({ status: 'archived' })
    await assert.rejects(
      async () => archiveProgram.execute({
        programId: 'program-1', tenantId: 'tenant-1', organizationId: 'org-1', expectedVersion: 3,
      }, commandContext(state)),
      /Program is already archived/,
    )
  })

  it('does not allow direct API command use to revise an archived program', async () => {
    const state = programState({ status: 'archived' })
    const scenario = SCENARIO_LIST[0]
    await assert.rejects(
      async () => reviseProgram.execute({
        programId: 'program-1', tenantId: 'tenant-1', organizationId: 'org-1', expectedVersion: 3,
        scenario, settings: scenario.defaults,
      }, commandContext(state)),
      /Archived programs cannot be revised/,
    )
  })

  it('enforces tenant scope before archive mutation', async () => {
    const state = programState()
    await assert.rejects(
      async () => archiveProgram.execute({
        programId: 'program-1', tenantId: 'tenant-2', organizationId: 'org-1', expectedVersion: 3,
      }, commandContext(state)),
      /Tenant scope mismatch/,
    )
    assert.equal(state.status, 'active')
  })

  it('requires an authenticated actor before archiving', async () => {
    const state = programState()
    await assert.rejects(
      async () => archiveProgram.execute({
        programId: 'program-1', tenantId: 'tenant-1', organizationId: 'org-1', expectedVersion: 3,
      }, commandContext(state, undefined, null)),
      /Authenticated actor is required to archive a program/,
    )
    assert.equal(state.status, 'active')
  })

  it('prevents the program owner from reviewing a version', async () => {
    const state = programState({ status: 'draft', ownerUserId: 'user-1' })
    await assert.rejects(
      async () => reviewProgram.execute({
        programVersionId: 'version-1', tenantId: 'tenant-1', organizationId: 'org-1', decision: 'approved', rationale: 'Looks ready',
      }, commandContext(state)),
      /cannot review their own version/,
    )
  })

  it('prevents the version creator from reviewing when they are not the program owner', async () => {
    const state = programState({ status: 'draft', ownerUserId: 'owner-1' })
    await assert.rejects(
      async () => reviewProgram.execute({
        programVersionId: 'version-1', tenantId: 'tenant-1', organizationId: 'org-1', decision: 'approved', rationale: 'Looks ready',
      }, commandContext(state, undefined, 'user-1', { versionCreator: 'user-1' })),
      /cannot review their own version/,
    )
  })

  it('activates a draft only when its current version is approved', async () => {
    const current = programState({ status: 'draft', ownerUserId: 'owner-1' })
    const currentResult = await reviewProgram.execute({
      programVersionId: 'version-1', tenantId: 'tenant-1', organizationId: 'org-1', decision: 'approved', rationale: 'Ready to pilot',
    }, commandContext(current))
    assert.ok(currentResult.reviewId)
    assert.equal(current.status, 'active')

    const stale = programState({ status: 'draft', ownerUserId: 'owner-1' })
    const staleResult = await reviewProgram.execute({
      programVersionId: 'version-1', tenantId: 'tenant-1', organizationId: 'org-1', decision: 'approved', rationale: 'Historical approval',
    }, commandContext(stale, undefined, 'reviewer-2', { versionNumber: 2 }))
    assert.ok(staleResult.reviewId)
    assert.equal(stale.status, 'draft')
  })

  it('does not create a second final decision for the same version', async () => {
    const state = programState({ status: 'draft', ownerUserId: 'owner-1' })
    await assert.rejects(
      async () => reviewProgram.execute({
        programVersionId: 'version-1', tenantId: 'tenant-1', organizationId: 'org-1', decision: 'rejected', rationale: 'Duplicate',
      }, commandContext(state, undefined, 'reviewer-2', { reviews: [{ programVersionId: 'version-1', decision: 'approved' }] })),
      /already has a final review decision/,
    )
    assert.equal(state.status, 'draft')
  })

  it('audits every lifecycle mutation without making immutable actions undoable or logging free text', async () => {
    const commands = [createProgram, reviseProgram, archiveProgram, reviewProgram, createPilot, updatePilotStatus, updatePilotCheckpoint]
    assert.ok(commands.every((command) => command.isUndoable === false && typeof command.buildLog === 'function'))

    const reviewAudit = await reviewProgram.buildLog?.({
      input: {
        tenantId: 'tenant-1', organizationId: 'org-1', programVersionId: 'version-1',
        decision: 'approved', rationale: 'Private reviewer note',
      },
      result: { reviewId: 'review-1' },
      ctx: commandContext(programState()),
      snapshots: {},
    })
    assert.equal(reviewAudit?.resourceKind, 'channel_architect.program_version')
    assert.deepEqual(reviewAudit?.payload, { programVersionId: 'version-1', reviewId: 'review-1', decision: 'approved' })
    assert.equal(JSON.stringify(reviewAudit).includes('Private reviewer note'), false)

    const pilotAudit = await createPilot.buildLog?.({
      input: {
        tenantId: 'tenant-1', organizationId: 'org-1',
        input: { programVersionId: 'version-1', name: 'Pilot', cohortLabel: 'Cohort', checkpoints: [{ title: 'Kickoff' }] },
      },
      result: { pilotId: 'pilot-1', checkpointIds: ['checkpoint-1'] },
      ctx: commandContext(programState()),
      snapshots: {},
    })
    assert.deepEqual(pilotAudit?.payload, {
      pilotId: 'pilot-1', programVersionId: 'version-1', checkpointIds: ['checkpoint-1'],
    })
    assert.equal(JSON.stringify(pilotAudit).includes('Cohort'), false)
  })

  it('creates a pilot only from the approved current version and persists its checkpoints', async () => {
    const ctx = pilotCommandContext({ reviewDecision: 'approved' })
    const result = await createPilot.execute({
      tenantId: 'tenant-1', organizationId: 'org-1',
      input: {
        programVersionId: 'a5892d87-b14c-4595-9e69-2b289c0cc610', name: 'Q4 partner pilot', cohortLabel: 'Q4 cohort',
        targetStartDate: '2026-10-01', targetEndDate: '2026-11-01',
        checkpoints: [{ title: 'Kickoff', dueDate: '2026-10-03' }],
      },
    }, ctx.runtime)

    assert.ok(result.pilotId)
    assert.equal(result.checkpointIds.length, 1)
    assert.equal(ctx.persisted.length, 2)
  })

  it('rejects pilots from rejected versions', async () => {
    await assert.rejects(
      async () => createPilot.execute({
        tenantId: 'tenant-1', organizationId: 'org-1',
        input: {
          programVersionId: 'a5892d87-b14c-4595-9e69-2b289c0cc610', name: 'Q4 partner pilot', cohortLabel: 'Q4 cohort',
          targetStartDate: '2026-10-01', checkpoints: [{ title: 'Kickoff', dueDate: '2026-10-03' }],
        },
      }, pilotCommandContext({ reviewDecision: 'rejected' }).runtime),
      /only start from an approved program version/,
    )
  })

  it('rejects a pilot if the program changes between approval check and transaction lock', async () => {
    await assert.rejects(
      async () => createPilot.execute({
        tenantId: 'tenant-1', organizationId: 'org-1',
        input: {
          programVersionId: 'a5892d87-b14c-4595-9e69-2b289c0cc610', name: 'Q4 partner pilot', cohortLabel: 'Q4 cohort',
          targetStartDate: '2026-10-01', checkpoints: [{ title: 'Kickoff', dueDate: '2026-10-03' }],
        },
      }, pilotCommandContext({ reviewDecision: 'approved', nextVersionAfterInitialRead: 2 }).runtime),
      /changed while the pilot was being created/,
    )
  })

  it('requires all checkpoints to be resolved before completing an active pilot', async () => {
    const checkpoints = [
      { id: 'checkpoint-1', pilotId: 'pilot-1', status: 'completed' },
      { id: 'checkpoint-2', pilotId: 'pilot-1', status: 'planned' },
    ]
    await assert.rejects(
      async () => updatePilotStatus.execute({
        tenantId: 'tenant-1', organizationId: 'org-1', pilotId: 'pilot-1', input: { status: 'completed', outcome: 'continue' },
      }, pilotCommandContext({ checkpoints }).runtime),
      /Complete or skip every checkpoint/,
    )
  })

  it('records a final pilot outcome after every checkpoint is resolved', async () => {
    const pilot = { id: 'pilot-1', tenantId: 'tenant-1', organizationId: 'org-1', status: 'active', isActive: true, deletedAt: null, outcome: null }
    const ctx = pilotCommandContext({
      pilot,
      checkpoints: [
        { id: 'checkpoint-1', pilotId: 'pilot-1', status: 'completed' },
        { id: 'checkpoint-2', pilotId: 'pilot-1', status: 'skipped' },
      ],
    })
    const result = await updatePilotStatus.execute({
      tenantId: 'tenant-1', organizationId: 'org-1', pilotId: 'pilot-1', input: { status: 'completed', outcome: 'revise' },
    }, ctx.runtime)
    assert.deepEqual(result, { pilotId: 'pilot-1', status: 'completed', outcome: 'revise' })
    assert.equal(pilot.status, 'completed')
    assert.equal(pilot.outcome, 'revise')
  })

  it('prevents updating checkpoints while a pilot is still planned', async () => {
    const pilot = { id: 'pilot-1', tenantId: 'tenant-1', organizationId: 'org-1', status: 'planned', isActive: true, deletedAt: null, outcome: null }
    await assert.rejects(
      async () => updatePilotCheckpoint.execute({
        tenantId: 'tenant-1', organizationId: 'org-1', pilotId: 'pilot-1', checkpointId: 'checkpoint-1', input: { status: 'completed' },
      }, pilotCommandContext({
        pilot,
        checkpoints: [{ id: 'checkpoint-1', pilotId: 'pilot-1', status: 'planned' }],
      }).runtime),
      /only be updated while a pilot is active or paused/,
    )
  })
})
