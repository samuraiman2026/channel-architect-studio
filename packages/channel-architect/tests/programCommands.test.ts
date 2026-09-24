import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { archiveProgram, reviseProgram } from '../src/modules/channel_architect/commands/programs'
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

function commandContext(state: ReturnType<typeof programState>, afterRead?: () => void, actorId: string | null = 'user-1') {
  const em = {
    fork() { return this },
    async findOne(_entity: unknown, where: Record<string, unknown>) {
      if (where.id !== state.id) return null
      const snapshot = { ...state }
      afterRead?.()
      return snapshot
    },
    async nativeUpdate(_entity: unknown, where: Record<string, unknown>, changes: Record<string, unknown>) {
      const matches = Object.entries(where).every(([key, value]) => state[key as keyof typeof state] === value)
      if (!matches) return 0
      Object.assign(state, changes)
      return 1
    },
    async begin() {},
    async commit() {},
    async rollback() {},
    async flush() {},
    create(_entity: unknown, data: Record<string, unknown>) { return data },
    persist() {},
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
})
