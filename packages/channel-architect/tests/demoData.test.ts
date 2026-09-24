import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_PROGRAMS, buildDemoPilotDates } from "../src/modules/channel_architect/lib/demoData";
import {
  generateDesign,
  validateDesignInputs,
} from "../src/modules/channel_architect/lib/designEngine";
import {
  pilotCreateSchema,
  programCreateSchema,
  programReviewSchema,
} from "../src/modules/channel_architect/data/validators";

describe("Channel Architect demo data", () => {
  it("provides realistic, valid designs with all generated sections", () => {
    assert.equal(DEMO_PROGRAMS.length, 3);
    const names = new Set<string>();

    for (const program of DEMO_PROGRAMS) {
      assert.equal(names.has(program.name), false, `${program.name} should be unique`);
      names.add(program.name);
      assert.deepEqual(validateDesignInputs(program.scenario, program.settings), []);
      assert.deepEqual(program.scenario.defaults, program.settings);
      assert.equal(Object.keys(generateDesign(program.scenario, program.settings)).length, 9);
      assert.equal(
        programCreateSchema.safeParse({
          name: program.name,
          scenario: program.scenario,
          settings: program.settings,
        }).success,
        true,
      );
      assert.equal(
        programReviewSchema.safeParse({
          decision: program.name.startsWith("Juniper Harbor") ? "rejected" : "approved",
          rationale: program.reviewRationale,
        }).success,
        true,
      );
      assert.ok(program.reviewRationale.length > 30);
      assert.ok(program.pilot.checkpoints.length >= 3);
    }
  });

  it("builds date-only pilot and checkpoint dates within the planned window", () => {
    const starts = [
      new Date("2026-09-24T00:00:00.000Z"),
      new Date("2024-02-28T23:59:59.000Z"),
      new Date("2026-12-31T23:59:59.000Z"),
      new Date("2026-07-19T23:59:59.000-05:00"),
    ];

    for (const program of DEMO_PROGRAMS) {
      for (const start of starts) {
        const dates = buildDemoPilotDates(program, start);
        const expectedStart = start.toISOString().slice(0, 10);
        assert.equal(dates.targetStartDate, expectedStart);
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
        assert.equal(dates.targetStartDate.length, 10);
        assert.equal(dates.targetEndDate.length, 10);
        assert.equal(
          pilotCreateSchema.safeParse({
            programVersionId: "00000000-0000-4000-8000-000000000001",
            name: program.pilot.name,
            cohortLabel: program.pilot.cohortLabel,
            targetStartDate: dates.targetStartDate,
            targetEndDate: dates.targetEndDate,
            checkpoints: dates.checkpoints,
          }).success,
          true,
        );
      }
    }
  });

  it("rejects invalid dates and schedules instead of emitting unusable API values", () => {
    const program = DEMO_PROGRAMS[0];
    assert.ok(program);
    assert.throws(() => buildDemoPilotDates(program, new Date(Number.NaN)), RangeError);
    assert.throws(
      () => buildDemoPilotDates(program, new Date("9999-12-31T00:00:00.000Z")),
      RangeError,
    );
    for (const durationDays of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(
        () =>
          buildDemoPilotDates({
            ...program,
            pilot: { ...program.pilot, durationDays },
          }),
        RangeError,
      );
    }
    for (const checkpoint of [
      { title: "Negative offset", dayOffset: -1 },
      { title: "Fractional offset", dayOffset: 1.5 },
      { title: "Out of range", dayOffset: program.pilot.durationDays + 1 },
      { title: "", dayOffset: 1 },
      { title: "   ", dayOffset: 1 },
    ]) {
      assert.throws(
        () =>
          buildDemoPilotDates({
            ...program,
            pilot: {
              ...program.pilot,
              checkpoints: [{ ...checkpoint, title: checkpoint.title.trim() }],
            },
          }),
        RangeError,
      );
    }
    for (const checkpoints of [
      [],
      Array.from({ length: 31 }, (_, index) => ({
        title: `Checkpoint ${index + 1}`,
        dayOffset: 0,
      })),
    ]) {
      assert.throws(
        () =>
          buildDemoPilotDates({
            ...program,
            pilot: { ...program.pilot, checkpoints },
          }),
        RangeError,
      );
    }
  });

  it("accepts API boundary schedules with one-day duration and thirty checkpoints", () => {
    const program = DEMO_PROGRAMS[0];
    assert.ok(program);
    const boundaryProgram = {
      ...program,
      pilot: {
        ...program.pilot,
        durationDays: 1,
        checkpoints: Array.from({ length: 30 }, (_, index) => ({
          title: `Checkpoint ${index + 1}`,
          dayOffset: index === 29 ? 1 : 0,
        })),
      },
    };
    const dates = buildDemoPilotDates(boundaryProgram, new Date("2026-12-31T00:00:00.000Z"));

    assert.equal(dates.targetStartDate, "2026-12-31");
    assert.equal(dates.targetEndDate, "2027-01-01");
    assert.equal(dates.checkpoints.length, 30);
    assert.equal(dates.checkpoints[29].dueDate, "2027-01-01");
    assert.equal(
      pilotCreateSchema.safeParse({
        programVersionId: "00000000-0000-4000-8000-000000000001",
        name: boundaryProgram.pilot.name,
        cohortLabel: boundaryProgram.pilot.cohortLabel,
        targetStartDate: dates.targetStartDate,
        targetEndDate: dates.targetEndDate,
        checkpoints: dates.checkpoints,
      }).success,
      true,
    );
  });
});
