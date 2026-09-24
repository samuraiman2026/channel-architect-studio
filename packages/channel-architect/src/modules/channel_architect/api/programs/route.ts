import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/postgresql'
import type { CommandBus, CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { resolveOrganizationScopeForRequest } from '@open-mercato/core/modules/directory/utils/organizationScope'
import { CrudHttpError, isCrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { validateCrudMutationGuard, runCrudMutationGuardAfterSuccess } from '@open-mercato/shared/lib/crud/mutation-guard'
import { ChannelArchitectProgram, ChannelArchitectProgramReview, ChannelArchitectProgramVersion } from '../../data/entities'
import { programCreateSchema, programRevisionSchema } from '../../data/validators'

const resourceKind = 'channel_architect.program'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['channel_architect.programs.view'] },
  POST: { requireAuth: true, requireFeatures: ['channel_architect.programs.manage'] },
  PATCH: { requireAuth: true, requireFeatures: ['channel_architect.programs.manage'] },
}

async function getContext(req: Request): Promise<{
  container: Awaited<ReturnType<typeof createRequestContainer>>
  ctx: CommandRuntimeContext
  tenantId: string
  organizationId: string
  userId: string
}> {
  const container = await createRequestContainer()
  const auth = await getAuthFromRequest(req)
  if (!auth?.tenantId || !auth.sub) throw new CrudHttpError(401, { error: 'Unauthorized' })
  const scope = await resolveOrganizationScopeForRequest({ container, auth, request: req })
  const organizationId = scope?.selectedId ?? auth.orgId ?? null
  if (!organizationId) throw new CrudHttpError(400, { error: 'Organization context is required.' })
  const ctx: CommandRuntimeContext = {
    container,
    auth,
    organizationScope: scope,
    selectedOrganizationId: organizationId,
    organizationIds: scope?.filterIds ?? [organizationId],
    request: req,
  }
  return { container, ctx, tenantId: auth.tenantId, organizationId, userId: auth.sub }
}

function errorResponse(error: unknown, operation: string) {
  if (isCrudHttpError(error)) return NextResponse.json(error.body, { status: error.status })
  if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid program request.', issues: error.issues }, { status: 400 })
  console.error(`[channel_architect] ${operation} failed`, error)
  return NextResponse.json({ error: 'Channel Architect request failed.' }, { status: 500 })
}

export async function GET(req: Request) {
  try {
    const { container, tenantId, organizationId } = await getContext(req)
    const em = container.resolve('em') as EntityManager
    const rawId = new URL(req.url).searchParams.get('id')
    const id = rawId ? z.string().uuid().parse(rawId) : null
    if (id) {
      const program = await em.findOne(ChannelArchitectProgram, { id, tenantId, organizationId, isActive: true, deletedAt: null })
      if (!program) throw new CrudHttpError(404, { error: 'Program not found.' })
      const versions = await em.find(ChannelArchitectProgramVersion, { programId: id, tenantId, organizationId, isActive: true, deletedAt: null }, { orderBy: { versionNumber: 'DESC' } })
      const versionIds = versions.map((version) => version.id)
      const reviews = versionIds.length
        ? await em.find(ChannelArchitectProgramReview, { programVersionId: { $in: versionIds }, tenantId, organizationId, isActive: true, deletedAt: null })
        : []
      return NextResponse.json({ program, versions, reviews })
    }
    const items = await em.find(ChannelArchitectProgram, { tenantId, organizationId, isActive: true, deletedAt: null }, { orderBy: { updatedAt: 'DESC' }, limit: 100 })
    return NextResponse.json({ items, total: items.length })
  } catch (error) {
    return errorResponse(error, 'GET')
  }
}

export async function POST(req: Request) {
  try {
    const context = await getContext(req)
    const input = programCreateSchema.parse(await req.json())
    const guard = await validateCrudMutationGuard(context.container, {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      userId: context.userId,
      resourceKind,
      resourceId: context.organizationId,
      operation: 'create',
      requestMethod: req.method,
      requestHeaders: req.headers,
      mutationPayload: input,
    })
    if (guard && !guard.ok) return NextResponse.json(guard.body, { status: guard.status })
    const bus = context.container.resolve('commandBus') as CommandBus
    const { result } = await bus.execute<typeof input & { tenantId: string; organizationId: string }, { programId: string; versionId: string; version: number }>(
      'channel_architect.programs.create',
      { input: { ...input, tenantId: context.tenantId, organizationId: context.organizationId }, ctx: context.ctx },
    )
    if (guard?.ok && guard.shouldRunAfterSuccess) {
      await runCrudMutationGuardAfterSuccess(context.container, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        userId: context.userId,
        resourceKind,
        resourceId: result.programId,
        operation: 'create',
        requestMethod: req.method,
        requestHeaders: req.headers,
        metadata: guard.metadata ?? null,
      })
    }
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return errorResponse(error, 'POST')
  }
}

export async function PATCH(req: Request) {
  try {
    const context = await getContext(req)
    const body = await req.json()
    const programId = z.string().uuid().parse(body.programId)
    const input = programRevisionSchema.parse(body)
    const guard = await validateCrudMutationGuard(context.container, {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      userId: context.userId,
      resourceKind,
      resourceId: programId,
      operation: 'update',
      requestMethod: req.method,
      requestHeaders: req.headers,
      mutationPayload: input,
    })
    if (guard && !guard.ok) return NextResponse.json(guard.body, { status: guard.status })
    const bus = context.container.resolve('commandBus') as CommandBus
    const { result } = await bus.execute<typeof input & { programId: string; tenantId: string; organizationId: string }, { versionId: string; version: number }>(
      'channel_architect.programs.revise',
      { input: { ...input, programId, tenantId: context.tenantId, organizationId: context.organizationId }, ctx: context.ctx },
    )
    if (guard?.ok && guard.shouldRunAfterSuccess) {
      await runCrudMutationGuardAfterSuccess(context.container, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        userId: context.userId,
        resourceKind,
        resourceId: programId,
        operation: 'update',
        requestMethod: req.method,
        requestHeaders: req.headers,
        metadata: guard.metadata ?? null,
      })
    }
    return NextResponse.json(result)
  } catch (error) {
    return errorResponse(error, 'PATCH')
  }
}

const errorSchema = z.object({ error: z.string() })
export const openApi: OpenApiRouteDoc = {
  tag: 'Channel Architect',
  summary: 'Manage partner programs and immutable design versions',
  methods: {
    GET: {
      summary: 'List or inspect programs',
      query: z.object({ id: z.string().uuid().optional() }),
      responses: [{ status: 200, description: 'Programs or a program with version history', schema: z.object({ items: z.array(z.unknown()).optional(), total: z.number().optional(), program: z.unknown().optional(), versions: z.array(z.unknown()).optional(), reviews: z.array(z.unknown()).optional() }) }],
      errors: [{ status: 401, description: 'Unauthorized', schema: errorSchema }],
    },
    POST: {
      summary: 'Create a program and its first version',
      requestBody: { contentType: 'application/json', schema: programCreateSchema },
      responses: [{ status: 201, description: 'Program created', schema: z.object({ programId: z.string(), versionId: z.string(), version: z.number() }) }],
      errors: [{ status: 400, description: 'Invalid request', schema: errorSchema }],
    },
    PATCH: {
      summary: 'Append a new program version',
      requestBody: { contentType: 'application/json', schema: programRevisionSchema.extend({ programId: z.string().uuid() }) },
      responses: [{ status: 200, description: 'Version created', schema: z.object({ versionId: z.string(), version: z.number() }) }],
      errors: [{ status: 409, description: 'Program version changed concurrently', schema: errorSchema }],
    },
  },
}
