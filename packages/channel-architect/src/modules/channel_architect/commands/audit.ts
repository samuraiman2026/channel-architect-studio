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
    // The command bus otherwise wraps the full raw input for redo. Lifecycle
    // records are immutable/non-undoable, so keep only this audited safe payload.
    payload: { __redoInput: input.payload },
    ...(input.relatedResourceKind ? { relatedResourceKind: input.relatedResourceKind } : {}),
    ...(input.relatedResourceId ? { relatedResourceId: input.relatedResourceId } : {}),
  }
}
