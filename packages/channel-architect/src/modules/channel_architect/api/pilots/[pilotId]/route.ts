import { NextResponse } from "next/server";
import { z } from "zod";
import type { CommandBus, CommandRuntimeContext } from "@open-mercato/shared/lib/commands";
import type { OpenApiRouteDoc } from "@open-mercato/shared/lib/openapi";
import { createRequestContainer } from "@open-mercato/shared/lib/di/container";
import { getAuthFromRequest } from "@open-mercato/shared/lib/auth/server";
import { resolveOrganizationScopeForRequest } from "@open-mercato/core/modules/directory/utils/organizationScope";
import { CrudHttpError, isCrudHttpError } from "@open-mercato/shared/lib/crud/errors";
import {
  validateCrudMutationGuard,
  runCrudMutationGuardAfterSuccess,
} from "@open-mercato/shared/lib/crud/mutation-guard";
import { pilotCheckpointUpdateSchema, pilotStatusUpdateSchema } from "../../../data/validators";

export const metadata = {
  PATCH: { requireAuth: true, requireFeatures: ["channel_architect.pilots.manage"] },
};

export async function PATCH(req: Request, { params }: { params: Promise<{ pilotId: string }> }) {
  try {
    const container = await createRequestContainer();
    const auth = await getAuthFromRequest(req);
    if (!auth?.tenantId || !auth.sub) throw new CrudHttpError(401, { error: "Unauthorized" });
    const scope = await resolveOrganizationScopeForRequest({ container, auth, request: req });
    const organizationId = scope?.selectedId ?? auth.orgId ?? null;
    if (!organizationId)
      throw new CrudHttpError(400, { error: "Organization context is required." });
    const { pilotId: rawPilotId } = await params;
    const pilotId = z.string().uuid().parse(rawPilotId);
    const body = (await req.json()) as Record<string, unknown>;
    const checkpointId = body.checkpointId ? z.string().uuid().parse(body.checkpointId) : null;
    const input = checkpointId
      ? pilotCheckpointUpdateSchema.parse({ status: body.status })
      : pilotStatusUpdateSchema.parse(body);
    const resourceId = checkpointId ?? pilotId;
    const guard = await validateCrudMutationGuard(container, {
      tenantId: auth.tenantId,
      organizationId,
      userId: auth.sub,
      resourceKind: checkpointId ? "channel_architect.pilot_checkpoint" : "channel_architect.pilot",
      resourceId,
      operation: "update",
      requestMethod: req.method,
      requestHeaders: req.headers,
      mutationPayload: input,
    });
    if (guard && !guard.ok) return NextResponse.json(guard.body, { status: guard.status });
    const ctx: CommandRuntimeContext = {
      container,
      auth,
      organizationScope: scope,
      selectedOrganizationId: organizationId,
      organizationIds: scope?.filterIds ?? [organizationId],
      request: req,
    };
    const bus = container.resolve("commandBus") as CommandBus;
    const commandId = checkpointId
      ? "channel_architect.pilots.update_checkpoint"
      : "channel_architect.pilots.update_status";
    const { result } = checkpointId
      ? await bus.execute<
          {
            tenantId: string;
            organizationId: string;
            pilotId: string;
            checkpointId: string;
            input: unknown;
          },
          { checkpointId: string; status: string }
        >(commandId, {
          input: { tenantId: auth.tenantId, organizationId, pilotId, checkpointId, input },
          ctx,
        })
      : await bus.execute<
          { tenantId: string; organizationId: string; pilotId: string; input: unknown },
          { pilotId: string; status: string; outcome: string | null }
        >(commandId, {
          input: { tenantId: auth.tenantId, organizationId, pilotId, input },
          ctx,
        });
    if (guard?.ok && guard.shouldRunAfterSuccess) {
      await runCrudMutationGuardAfterSuccess(container, {
        tenantId: auth.tenantId,
        organizationId,
        userId: auth.sub,
        resourceKind: checkpointId
          ? "channel_architect.pilot_checkpoint"
          : "channel_architect.pilot",
        resourceId,
        operation: "update",
        requestMethod: req.method,
        requestHeaders: req.headers,
        metadata: guard.metadata ?? null,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (isCrudHttpError(error)) return NextResponse.json(error.body, { status: error.status });
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid pilot update.", issues: error.issues },
        { status: 400 },
      );
    console.error("[channel_architect] pilot PATCH failed", error);
    return NextResponse.json({ error: "Unable to update pilot." }, { status: 500 });
  }
}

export const openApi: OpenApiRouteDoc = {
  tag: "Channel Architect",
  summary: "Update a pilot or one of its checkpoints",
  methods: {
    PATCH: {
      summary: "Transition pilot status or complete/skip a checkpoint",
      requestBody: {
        contentType: "application/json",
        schema: z.union([
          pilotStatusUpdateSchema,
          pilotCheckpointUpdateSchema.extend({ checkpointId: z.string().uuid() }),
        ]),
      },
      responses: [
        {
          status: 200,
          description: "Pilot state updated",
          schema: z.record(z.string(), z.unknown()),
        },
      ],
      errors: [
        {
          status: 400,
          description: "Invalid status transition",
          schema: z.object({ error: z.string() }),
        },
        {
          status: 409,
          description: "Pilot or checkpoint changed concurrently",
          schema: z.object({ error: z.string() }),
        },
      ],
    },
  },
};
