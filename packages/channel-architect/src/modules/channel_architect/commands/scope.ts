import { CrudHttpError } from '@open-mercato/shared/lib/crud/errors'
import type { CommandRuntimeContext } from '@open-mercato/shared/lib/commands'

export function ensureTenantScope(ctx: CommandRuntimeContext, tenantId: string) {
  if (!ctx.auth?.tenantId || ctx.auth.tenantId !== tenantId) {
    throw new CrudHttpError(403, { error: 'Tenant scope mismatch.' })
  }
}

export function ensureOrganizationScope(ctx: CommandRuntimeContext, organizationId: string) {
  const allowed = ctx.organizationIds ?? (ctx.selectedOrganizationId ? [ctx.selectedOrganizationId] : [])
  if (!allowed.includes(organizationId)) {
    throw new CrudHttpError(403, { error: 'Organization scope mismatch.' })
  }
}
