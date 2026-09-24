import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pilotCreateSchema,
  pilotStatusUpdateSchema,
} from "../../packages/channel-architect/src/modules/channel_architect/data/validators";
import {
  canCompletePilot,
  canUpdatePilotCheckpoints,
  isPilotTransitionAllowed,
} from "../../packages/channel-architect/src/modules/channel_architect/lib/pilotState";

describe("pilot workflow acceptance rules", () => {
  it("allows only the documented lifecycle transitions and keeps terminal states closed", () => {
    assert.equal(isPilotTransitionAllowed("planned", "active"), true);
    assert.equal(isPilotTransitionAllowed("active", "paused"), true);
    assert.equal(isPilotTransitionAllowed("paused", "active"), true);
    assert.equal(isPilotTransitionAllowed("planned", "completed"), false);
    assert.equal(isPilotTransitionAllowed("completed", "active"), false);
    assert.equal(isPilotTransitionAllowed("cancelled", "active"), false);
  });

  it("allows checkpoint updates only during active or paused pilots", () => {
    assert.equal(canUpdatePilotCheckpoints("active"), true);
    assert.equal(canUpdatePilotCheckpoints("paused"), true);
    assert.equal(canUpdatePilotCheckpoints("planned"), false);
    assert.equal(canUpdatePilotCheckpoints("completed"), false);
    assert.equal(canUpdatePilotCheckpoints("cancelled"), false);
  });

  it("requires every checkpoint to be completed or skipped before completion", () => {
    assert.equal(canCompletePilot(["completed", "skipped"]), true);
    assert.equal(canCompletePilot(["completed", "planned"]), false);
    assert.equal(canCompletePilot([]), false);
  });

  it("requires a valid date range and at least one in-range checkpoint", () => {
    const base = {
      programVersionId: "a5892d87-b14c-4595-9e69-2b289c0cc610",
      name: "Partner onboarding pilot",
      cohortLabel: "Q4 cohort",
      targetStartDate: "2026-10-01",
      targetEndDate: "2026-11-01",
      checkpoints: [{ title: "Kickoff", dueDate: "2026-10-03" }],
    };
    assert.equal(pilotCreateSchema.safeParse(base).success, true);
    assert.equal(
      pilotCreateSchema.safeParse({ ...base, targetEndDate: "2026-09-30" }).success,
      false,
    );
    assert.equal(
      pilotCreateSchema.safeParse({
        ...base,
        checkpoints: [{ title: "Kickoff", dueDate: "2026-11-02" }],
      }).success,
      false,
    );
    assert.equal(
      pilotCreateSchema.safeParse({ ...base, targetStartDate: "2026-02-30" }).success,
      false,
    );
    assert.equal(pilotCreateSchema.safeParse({ ...base, checkpoints: [] }).success, false);
  });

  it("requires exactly the completion outcome at the completion transition", () => {
    assert.equal(
      pilotStatusUpdateSchema.safeParse({ status: "completed", outcome: "continue" }).success,
      true,
    );
    assert.equal(pilotStatusUpdateSchema.safeParse({ status: "completed" }).success, false);
    assert.equal(
      pilotStatusUpdateSchema.safeParse({ status: "paused", outcome: "revise" }).success,
      false,
    );
  });
});
