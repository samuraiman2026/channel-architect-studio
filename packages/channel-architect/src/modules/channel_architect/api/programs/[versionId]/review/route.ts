import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { CommandBus, CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { resolveOrganizationScopeForRequest } from '@open-mercato/core/modules/directory/utils/organizationScope'
import { CrudHttpError, isCrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { validateCrudMutationGuard, runCrudMutationGuardAfterSuccess } from '@open-mercato/shared/lib/crud/mutation-guard'
import { programReviewSchema } from '../../../../data/validators'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['channel_architect.programs.approve'] },
}

export async function POST(req: Request, { params }: { params: Promise<{ versionId: string }> }) {
  try {
    const container = await createRequestContainer()
    const auth = await getAuthFromRequest(req)
    if (!auth?.tenantId || !auth.sub) throw new CrudHttpError(401, { error: 'Unauthorized' })
    const scope = await resolveOrganizationScopeForRequest({ container, auth, request: req })
    const organizationId = scope?.selectedId ?? auth.orgId ?? null
    if (!organizationId) throw new CrudHttpError(400, { error: 'Organization context is required.' })
    const { versionId: rawVersionId } = await params
    const versionId = z.string().uuid().parse(rawVersionId)
    const input = programReviewSchema.parse(await req.json())
    const guard = await validateCrudMutationGuard(container, {
      tenantId: auth.tenantId,
      organizationId,
      userId: auth.sub,
      resourceKind: 'channel_architect.program_version',
      resourceId: versionId,
      operation: 'update',
      requestMethod: req.method,
      requestHeaders: req.headers,
      mutationPayload: input,
    })
    if (guard && !guard.ok) return NextResponse.json(guard.body, { status: guard.status })
    const ctx: CommandRuntimeContext = {
      container,
      auth,
      organizationScope: scope,
      selectedOrganizationId: organizationId,
      organizationIds: scope?.filterIds ?? [organizationId],
      request: req,
    }
    const bus = container.resolve('commandBus') as CommandBus
    const { result } = await bus.execute<typeof input & { tenantId: string; organizationId: string; programVersionId: string }, { reviewId: string }>(
      'channel_architect.programs.review',
      { input: { ...input, programVersionId: versionId, tenantId: auth.tenantId, organizationId }, ctx },
    )
    if (guard?.ok && guard.shouldRunAfterSuccess) {
      await runCrudMutationGuardAfterSuccess(container, {
        tenantId: auth.tenantId,
        organizationId,
        userId: auth.sub,
        resourceKind: 'channel_architect.program_version',
        resourceId: versionId,
        operation: 'update',
        requestMethod: req.method,
        requestHeaders: req.headers,
        metadata: guard.metadata ?? null,
      })
    }
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (isCrudHttpError(error)) return NextResponse.json(error.body, { status: error.status })
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid review request.', issues: error.issues }, { status: 400 })
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'This version already has a final review decision.' }, { status: 409 })
    }
    console.error('[channel_architect] review POST failed', error)
    return NextResponse.json({ error: 'Unable to record review.' }, { status: 500 })
  }
}

export const openApi: OpenApiRouteDoc = {
  tag: 'Channel Architect',
  summary: 'Record a final review decision for a program version',
  methods: {
    POST: {
      summary: 'Approve or reject a version',
      requestBody: { contentType: 'application/json', schema: programReviewSchema },
      responses: [{ status: 201, description: 'Review decision recorded', schema: z.object({ reviewId: z.string() }) }],
      errors: [
        { status: 400, description: 'Invalid review request', schema: z.object({ error: z.string() }) },
        { status: 403, description: 'Reviewer is not independent of the program version', schema: z.object({ error: z.string() }) },
        { status: 409, description: 'A decision already exists', schema: z.object({ error: z.string() }) },
      ],
    },
  },
}
