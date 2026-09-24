import { expect, test, type Page } from '@playwright/test'
import { SCENARIO_LIST } from '../lib/scenarios'

type Role = 'superadmin' | 'admin' | 'employee'
type ProgramCreated = { programId: string; versionId: string; version: number }
type PilotCreated = { pilotId: string; checkpointIds: string[] }
type OrganizationCreated = { id: string }

const credentials: Record<Role, { email: string; password: string }> = {
  superadmin: {
    email: process.env.OM_INIT_SUPERADMIN_EMAIL || 'superadmin@acme.com',
    password: process.env.OM_INIT_SUPERADMIN_PASSWORD || 'secret',
  },
  admin: { email: 'admin@acme.com', password: 'secret' },
  employee: { email: 'employee@acme.com', password: 'secret' },
}

async function login(page: Page, role: Role) {
  await page.goto(`/login?role=${role}`)
  await expect(page.getByRole('heading', { name: 'Open Mercato' })).toBeVisible()
  await page.getByLabel('Email').fill(credentials[role].email)
  await page.getByLabel('Password').fill(credentials[role].password)
  await page.getByLabel('Password').press('Enter')
  await page.waitForURL(/\/backend(?:\?.*)?$/)
}

function dateFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

test.describe('TC-CHANNEL-ARCHITECT-001: governed program and pilot workflow', () => {
  test('enforces role grants and keeps pilots bound to approved current versions', async ({ page, browser }) => {
    test.setTimeout(90_000)
    const scenario = SCENARIO_LIST[0]
    const settings = scenario.defaults
    const programName = `Channel Architect acceptance ${Date.now()}`
    const createPayload = {
      name: programName,
      scenario,
      settings,
      tenantId: '00000000-0000-4000-8000-000000000001',
      organizationId: '00000000-0000-4000-8000-000000000002',
    }

    await login(page, 'superadmin')
    await page.goto('/backend/channel-architect')
    await expect(page.getByRole('heading', { name: 'Partner programs' })).toBeVisible()

    const createdResponse = await page.request.post('/api/channel_architect/programs', { data: createPayload })
    expect(createdResponse.status()).toBe(201)
    const created = await createdResponse.json() as ProgramCreated
    expect(created.version).toBe(1)

    const detailResponse = await page.request.get(`/api/channel_architect/programs?id=${created.programId}`)
    expect(detailResponse.status()).toBe(200)
    const initialDetail = await detailResponse.json()
    expect(initialDetail.program.name).toBe(programName)
    expect(initialDetail.program.tenantId).not.toBe(createPayload.tenantId)
    expect(initialDetail.program.organizationId).not.toBe(createPayload.organizationId)
    expect(initialDetail.versions).toHaveLength(1)
    expect(initialDetail.versions[0].scenarioSnapshot).toEqual(scenario)

    const organizationResponse = await page.request.post('/api/directory/organizations', {
      data: { name: `${programName} separate organization` },
    })
    expect(organizationResponse.status()).toBe(201)
    const foreignOrganization = await organizationResponse.json() as OrganizationCreated
    const previousOrganizationCookie = (await page.context().cookies()).find((cookie) => cookie.name === 'om_selected_org')
    let foreignProgram: ProgramCreated
    try {
      await page.context().addCookies([{
        name: 'om_selected_org',
        value: foreignOrganization.id,
        url: new URL(page.url()).origin,
      }])
      const foreignProgramResponse = await page.request.post('/api/channel_architect/programs', {
        data: { ...createPayload, name: `${programName} separate organization` },
      })
      expect(foreignProgramResponse.status()).toBe(201)
      foreignProgram = await foreignProgramResponse.json() as ProgramCreated
    } finally {
      if (previousOrganizationCookie) await page.context().addCookies([previousOrganizationCookie])
      else await page.context().clearCookies({ name: 'om_selected_org' })
    }

    const ownerReviewResponse = await page.request.post(
      `/api/channel_architect/programs/${created.versionId}/review`,
      { data: { decision: 'approved', rationale: 'Owner cannot review this version.' } },
    )
    expect(ownerReviewResponse.status()).toBe(403)

    const reviewerPage = await browser.newPage()
    try {
      await login(reviewerPage, 'admin')
      const reviewResponse = await reviewerPage.request.post(
        `/api/channel_architect/programs/${created.versionId}/review`,
        { data: { decision: 'approved', rationale: 'Acceptance test reviewer approved the current version.' } },
      )
      expect(reviewResponse.status()).toBe(201)
      const duplicateReviewResponse = await reviewerPage.request.post(
        `/api/channel_architect/programs/${created.versionId}/review`,
        { data: { decision: 'rejected', rationale: 'A final decision already exists.' } },
      )
      expect(duplicateReviewResponse.status()).toBe(409)
      const approvedDetailResponse = await reviewerPage.request.get(`/api/channel_architect/programs?id=${created.programId}`)
      expect(approvedDetailResponse.status()).toBe(200)
      const approvedDetail = await approvedDetailResponse.json()
      expect(approvedDetail.program.status).toBe('active')
      expect(approvedDetail.reviews).toHaveLength(1)
      expect(approvedDetail.reviews[0].decision).toBe('approved')

      const foreignDetailResponse = await reviewerPage.request.get(`/api/channel_architect/programs?id=${foreignProgram.programId}`)
      expect(foreignDetailResponse.status()).toBe(404)
      const scopedListResponse = await reviewerPage.request.get('/api/channel_architect/programs')
      expect(scopedListResponse.status()).toBe(200)
      const scopedList = await scopedListResponse.json()
      expect(scopedList.items.some((item: { id: string }) => item.id === foreignProgram.programId)).toBe(false)
      const foreignRevisionResponse = await reviewerPage.request.patch('/api/channel_architect/programs', {
        data: {
          programId: foreignProgram.programId,
          expectedVersion: 1,
          scenario,
          settings,
        },
      })
      expect(foreignRevisionResponse.status()).toBe(404)
      const foreignReviewResponse = await reviewerPage.request.post(
        `/api/channel_architect/programs/${foreignProgram.versionId}/review`,
        { data: { decision: 'approved', rationale: 'Cross-organization access must be denied.' } },
      )
      expect(foreignReviewResponse.status()).toBe(404)
    } finally {
      await reviewerPage.close()
    }

    const employeePage = await browser.newPage()
    try {
      await login(employeePage, 'employee')
      const listResponse = await employeePage.request.get('/api/channel_architect/programs')
      expect(listResponse.status()).toBe(200)
      const list = await listResponse.json()
      expect(list.items.some((program: { id: string }) => program.id === created.programId)).toBe(true)
      const deniedCreateResponse = await employeePage.request.post('/api/channel_architect/programs', {
        data: { ...createPayload, name: `${programName} unauthorized` },
      })
      expect(deniedCreateResponse.status()).toBe(403)
      const deniedReviewResponse = await employeePage.request.post(
        `/api/channel_architect/programs/${created.versionId}/review`,
        { data: { decision: 'rejected', rationale: 'Employee does not have review permission.' } },
      )
      expect(deniedReviewResponse.status()).toBe(403)
    } finally {
      await employeePage.close()
    }

    const startDate = dateFromNow(1)
    const checkpointDate = dateFromNow(2)
    const endDate = dateFromNow(7)
    const pilotPayload = {
      programVersionId: created.versionId,
      name: `${programName} pilot`,
      cohortLabel: 'Acceptance cohort',
      targetStartDate: startDate,
      targetEndDate: endDate,
      checkpoints: [{ title: 'Acceptance checkpoint', dueDate: checkpointDate }],
    }
    const pilotResponse = await page.request.post('/api/channel_architect/pilots', { data: pilotPayload })
    expect(pilotResponse.status()).toBe(201)
    const pilot = await pilotResponse.json() as PilotCreated
    expect(pilot.checkpointIds).toHaveLength(1)

    const pilotViewerPage = await browser.newPage()
    try {
      await login(pilotViewerPage, 'employee')
      const pilotsResponse = await pilotViewerPage.request.get('/api/channel_architect/pilots')
      expect(pilotsResponse.status()).toBe(200)
      const pilots = await pilotsResponse.json()
      expect(pilots.items.some((item: { id: string }) => item.id === pilot.pilotId)).toBe(true)
    } finally {
      await pilotViewerPage.close()
    }

    const activateResponse = await page.request.patch(`/api/channel_architect/pilots/${pilot.pilotId}`, {
      data: { status: 'active' },
    })
    expect(activateResponse.status()).toBe(200)
    const prematureCompletionResponse = await page.request.patch(`/api/channel_architect/pilots/${pilot.pilotId}`, {
      data: { status: 'completed', outcome: 'continue' },
    })
    expect(prematureCompletionResponse.status()).toBe(409)
    const checkpointResponse = await page.request.patch(`/api/channel_architect/pilots/${pilot.pilotId}`, {
      data: { checkpointId: pilot.checkpointIds[0], status: 'completed' },
    })
    expect(checkpointResponse.status()).toBe(200)
    const completeResponse = await page.request.patch(`/api/channel_architect/pilots/${pilot.pilotId}`, {
      data: { status: 'completed', outcome: 'continue' },
    })
    expect(completeResponse.status()).toBe(200)
    expect(await completeResponse.json()).toMatchObject({ status: 'completed', outcome: 'continue' })
    const reopenedPilotResponse = await page.request.patch(`/api/channel_architect/pilots/${pilot.pilotId}`, {
      data: { status: 'active' },
    })
    expect(reopenedPilotResponse.status()).toBe(409)

    const revisionResponse = await page.request.patch('/api/channel_architect/programs', {
      data: {
        programId: created.programId,
        expectedVersion: 1,
        scenario: { ...scenario, ask: `${scenario.ask} Revised for acceptance.` },
        settings,
      },
    })
    expect(revisionResponse.status()).toBe(200)
    const revision = await revisionResponse.json() as { versionId: string; version: number }
    expect(revision.version).toBe(2)

    const stalePilotResponse = await page.request.post('/api/channel_architect/pilots', { data: pilotPayload })
    expect(stalePilotResponse.status()).toBe(409)
    const unapprovedPilotResponse = await page.request.post('/api/channel_architect/pilots', {
      data: { ...pilotPayload, programVersionId: revision.versionId },
    })
    expect(unapprovedPilotResponse.status()).toBe(409)

    const rejectionPage = await browser.newPage()
    try {
      await login(rejectionPage, 'admin')
      const rejectionResponse = await rejectionPage.request.post(
        `/api/channel_architect/programs/${revision.versionId}/review`,
        { data: { decision: 'rejected', rationale: 'Acceptance test verifies rejected versions cannot pilot.' } },
      )
      expect(rejectionResponse.status()).toBe(201)
    } finally {
      await rejectionPage.close()
    }
    const rejectedPilotResponse = await page.request.post('/api/channel_architect/pilots', {
      data: { ...pilotPayload, programVersionId: revision.versionId },
    })
    expect(rejectedPilotResponse.status()).toBe(409)

    const archiveResponse = await page.request.patch('/api/channel_architect/programs', {
      data: { programId: created.programId, expectedVersion: 2, action: 'archive' },
    })
    expect(archiveResponse.status()).toBe(200)
    const archivedDetailResponse = await page.request.get(`/api/channel_architect/programs?id=${created.programId}`)
    expect(archivedDetailResponse.status()).toBe(200)
    const archivedDetail = await archivedDetailResponse.json()
    expect(archivedDetail.program.status).toBe('archived')
    expect(archivedDetail.versions).toHaveLength(2)
    expect(archivedDetail.reviews).toHaveLength(2)
    const archivedPilotResponse = await page.request.post('/api/channel_architect/pilots', {
      data: { ...pilotPayload, programVersionId: revision.versionId },
    })
    expect(archivedPilotResponse.status()).toBe(409)
    expect((await archivedPilotResponse.json()).error).toContain('Archived programs cannot start new pilots')
    const archivedRevisionResponse = await page.request.patch('/api/channel_architect/programs', {
      data: {
        programId: created.programId,
        expectedVersion: 2,
        scenario: { ...scenario, ask: `${scenario.ask} Must not be saved.` },
        settings,
      },
    })
    expect(archivedRevisionResponse.status()).toBe(409)
  })
})
