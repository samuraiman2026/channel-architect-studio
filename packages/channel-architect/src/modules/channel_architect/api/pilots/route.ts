import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { CommandBus, CommandRuntimeContext } from '@open-mercato/shared/lib/commands'
import type { EntityManager } from '@mikro-orm/postgresql'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { resolveOrganizationScopeForRequest } from '@open-mercato/core/modules/directory/utils/organizationScope'
import { CrudHttpError, isCrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import { validateCrudMutationGuard, runCrudMutationGuardAfterSuccess } from '@open-mercato/shared/lib/crud/mutation-guard'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import {
  ChannelArchitectPilot,
  ChannelArchitectPilotCheckpoint,
  ChannelArchitectProgram,
  ChannelArchitectProgramVersion,
} from '../../data/entities'
import { pilotCreateSchema } from '../../data/validators'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['channel_architect.pilots.view'] },
  POST: { requireAuth: true, requireFeatures: ['channel_architect.pilots.manage'] },
}

async function getContext(req: Request) {
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
  if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid pilot request.', issues: error.issues }, { status: 400 })
  console.error(`[channel_architect] pilot ${operation} failed`, error)
  return NextResponse.json({ error: 'Channel Architect pilot request failed.' }, { status: 500 })
}

export async function GET(req: Request) {
  try {
    const { container, tenantId, organizationId } = await getContext(req)
    const em = container.resolve('em') as EntityManager
    const params = new URL(req.url).searchParams
    const rawPage = Number(params.get('page') ?? 1)
    const rawPageSize = Number(params.get('pageSize') ?? 25)
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1
    const pageSize = Number.isFinite(rawPageSize) ? Math.min(100, Math.max(1, Math.floor(rawPageSize))) : 25
    const search = z.string().trim().max(120).optional().parse(params.get('search') || undefined)
    const status = z.enum(['planned', 'active', 'paused', 'completed', 'cancelled']).optional().parse(params.get('status') || undefined)
    const escapedSearch = search ? escapeLikePattern(search) : undefined
    const where = {
      tenantId,
      organizationId,
      isActive: true,
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(escapedSearch ? { name: { $ilike: `%${escapedSearch}%` } } : {}),
    }
    const [items, totalCount] = await Promise.all([
      em.find(ChannelArchitectPilot, where, { orderBy: { updatedAt: 'DESC' }, limit: pageSize, offset: (page - 1) * pageSize }),
      em.count(ChannelArchitectPilot, where),
    ])
    const pilotIds = items.map((pilot) => pilot.id)
    const checkpoints = pilotIds.length
      ? await em.find(ChannelArchitectPilotCheckpoint, { pilotId: { $in: pilotIds }, tenantId, organizationId, isActive: true, deletedAt: null }, { orderBy: { sortOrder: 'ASC' } })
      : []
    const versionIds = [...new Set(items.map((pilot) => pilot.programVersionId))]
    const versions = versionIds.length
      ? await em.find(ChannelArchitectProgramVersion, {
        id: { $in: versionIds }, tenantId, organizationId, isActive: true, deletedAt: null,
      })
      : []
    const programIds = [...new Set(versions.map((version) => version.programId))]
    const programs = programIds.length
      ? await em.find(ChannelArchitectProgram, {
        id: { $in: programIds }, tenantId, organizationId, isActive: true, deletedAt: null,
      })
      : []
    const checkpointsByPilot = new Map<string, ChannelArchitectPilotCheckpoint[]>()
    for (const checkpoint of checkpoints) {
      const list = checkpointsByPilot.get(checkpoint.pilotId) ?? []
      list.push(checkpoint)
      checkpointsByPilot.set(checkpoint.pilotId, list)
    }
    const versionsById = new Map(versions.map((version) => [version.id, version]))
    const programsById = new Map(programs.map((program) => [program.id, program]))
    return NextResponse.json({
      items: items.map((pilot) => {
        const version = versionsById.get(pilot.programVersionId)
        const program = version ? programsById.get(version.programId) : undefined
        return {
          ...pilot,
          programName: program?.name ?? 'Unavailable program',
          programVersionNumber: version?.versionNumber ?? null,
          checkpoints: checkpointsByPilot.get(pilot.id) ?? [],
        }
      }),
      totalCount,
      page,
      pageSize,
    })
  } catch (error) {
    return errorResponse(error, 'GET')
  }
}

export async function POST(req: Request) {
  try {
    const context = await getContext(req)
    const input = pilotCreateSchema.parse(await req.json())
    const guard = await validateCrudMutationGuard(context.container, {
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      userId: context.userId,
      resourceKind: 'channel_architect.pilot',
      resourceId: context.organizationId,
      operation: 'create',
      requestMethod: req.method,
      requestHeaders: req.headers,
      mutationPayload: input,
    })
    if (guard && !guard.ok) return NextResponse.json(guard.body, { status: guard.status })
    const bus = context.container.resolve('commandBus') as CommandBus
    const { result } = await bus.execute<typeof input & { tenantId: string; organizationId: string }, { pilotId: string; checkpointIds: string[] }>(
      'channel_architect.pilots.create',
      { input: { ...input, tenantId: context.tenantId, organizationId: context.organizationId }, ctx: context.ctx },
    )
    if (guard?.ok && guard.shouldRunAfterSuccess) {
      await runCrudMutationGuardAfterSuccess(context.container, {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
        userId: context.userId,
        resourceKind: 'channel_architect.pilot',
        resourceId: result.pilotId,
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

export const openApi: OpenApiRouteDoc = {
  tag: 'Channel Architect',
  summary: 'Create and track partner program pilots',
  methods: {
    GET: {
      summary: 'List pilots and their checkpoints',
      query: z.object({ page: z.coerce.number().int().positive().optional(), pageSize: z.coerce.number().int().min(1).max(100).optional(), search: z.string().trim().max(120).optional(), status: z.enum(['planned', 'active', 'paused', 'completed', 'cancelled']).optional() }),
      responses: [{ status: 200, description: 'Scoped pilot records', schema: z.object({ items: z.array(z.unknown()), totalCount: z.number(), page: z.number(), pageSize: z.number() }) }],
    },
    POST: {
      summary: 'Start planning a pilot from the current approved program version',
      requestBody: { contentType: 'application/json', schema: pilotCreateSchema },
      responses: [{ status: 201, description: 'Pilot and checkpoints created', schema: z.object({ pilotId: z.string(), checkpointIds: z.array(z.string()) }) }],
      errors: [{ status: 409, description: 'Program version is not the current approved version', schema: z.object({ error: z.string() }) }],
    },
  },
}
