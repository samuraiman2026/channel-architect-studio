import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_PROGRAMS, buildDemoPilotDates } from "../src/modules/channel_architect/lib/demoData";
import {
  generateDesign,
  validateDesignInputs,
} from "../src/modules/channel_architect/lib/designEngine";

describe("Channel Architect demo data", () => {
  it("provides realistic, valid designs with all generated sections", () => {
    assert.equal(DEMO_PROGRAMS.length, 3);
    const names = new Set<string>();

    for (const program of DEMO_PROGRAMS) {
      assert.equal(names.has(program.name), false, `${program.name} should be unique`);
      names.add(program.name);
      assert.deepEqual(validateDesignInputs(program.scenario, program.settings), []);
      assert.equal(Object.keys(generateDesign(program.scenario, program.settings)).length, 9);
      assert.ok(program.reviewRationale.length > 30);
      assert.ok(program.pilot.checkpoints.length >= 3);
    }
  });

  it("builds date-only pilot and checkpoint dates within the planned window", () => {
    const start = new Date("2026-09-24T00:00:00.000Z");

    for (const program of DEMO_PROGRAMS) {
      const dates = buildDemoPilotDates(program, start);
      assert.equal(dates.targetStartDate, "2026-09-24");
      const durationMs =
        Date.parse(`${dates.targetEndDate}T00:00:00.000Z`) -
        Date.parse(`${dates.targetStartDate}T00:00:00.000Z`);
      assert.equal(durationMs, program.pilot.durationDays * 24 * 60 * 60 * 1000);
      assert.equal(dates.checkpoints.length, program.pilot.checkpoints.length);
      assert.ok(
        dates.checkpoints.every(
          (checkpoint) =>
            checkpoint.dueDate >= dates.targetStartDate &&
            checkpoint.dueDate <= dates.targetEndDate,
        ),
      );
    }
  });
});
