export const PILOT_STATUSES = ["planned", "active", "paused", "completed", "cancelled"] as const;
export type PilotStatus = (typeof PILOT_STATUSES)[number];
export type CheckpointStatus = "planned" | "completed" | "skipped";

const allowedTransitions: Record<PilotStatus, readonly PilotStatus[]> = {
  planned: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isPilotTransitionAllowed(current: PilotStatus, next: PilotStatus): boolean {
  return allowedTransitions[current].includes(next);
}

export function canUpdatePilotCheckpoints(status: PilotStatus): boolean {
  return status === "active" || status === "paused";
}

export function canCompletePilot(checkpointStatuses: readonly CheckpointStatus[]): boolean {
  return (
    checkpointStatuses.length > 0 && checkpointStatuses.every((status) => status !== "planned")
  );
}
