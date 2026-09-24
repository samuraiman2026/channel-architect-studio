import type { CommandLogMetadata } from '@open-mercato/shared/lib/commands'

type ChannelArchitectAuditInput = {
  actionLabel: string
  resourceKind: string
  resourceId: string
  tenantId: string
  organizationId: string
  actorUserId: string | null
  payload: Record<string, unknown>
  relatedResourceKind?: string
  relatedResourceId?: string
}

export function buildChannelArchitectAuditLog(input: ChannelArchitectAuditInput): CommandLogMetadata {
  return {
    actionLabel: input.actionLabel,
    resourceKind: input.resourceKind,
    resourceId: input.resourceId,
    tenantId: input.tenantId,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    payload: input.payload,
    ...(input.relatedResourceKind ? { relatedResourceKind: input.relatedResourceKind } : {}),
    ...(input.relatedResourceId ? { relatedResourceId: input.relatedResourceId } : {}),
  }
}
