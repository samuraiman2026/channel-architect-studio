import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { archiveProgram, reviseProgram, reviewProgram } from '../src/modules/channel_architect/commands/programs'
import {
  ChannelArchitectProgram,
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

describe('program lifecycle commands', () => {
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
})
