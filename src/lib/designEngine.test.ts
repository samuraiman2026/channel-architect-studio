import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "./scenarios";
import {
  DESIGN_ENGINE_VERSION,
  generateDesign,
  regenerateDesign,
  validateDesignInputs,
} from "./designEngine";

describe("design engine", () => {
  const scenario = SCENARIOS["ai-infra-b"];

  it("produces all nine sections from the selected inputs", () => {
    const result = generateDesign(scenario, scenario.defaults);
    assert.equal(Object.keys(result).length, 9);
    assert.ok(result["exec-summary"].includes(scenario.ask));
    assert.ok(result.ipp.includes(scenario.icp));
    assert.ok(result.economics.includes("Influence: 70%"));
    assert.ok(result.economics.includes("not payout terms"));
  });

  it("changes the motion when planning emphasis changes", () => {
    const result = generateDesign(scenario, {
      ...scenario.defaults,
      economics: { resell: 80, refer: 20, influence: 0, buildOn: 0 },
    });
    assert.ok(result.motions.includes("First motion: Resell"));
    assert.ok(!result.economics.includes("Influence: 70%"));
  });

  it("pre-PMF avoids formal tiers", () => {
    const result = generateDesign(scenario, { ...scenario.defaults, stage: "Pre-PMF" });
    assert.ok(result.tiering.includes("No formal tiers yet"));
  });

  it("rejects invalid planning weights and missing context", () => {
    assert.equal(
      validateDesignInputs(scenario, {
        ...scenario.defaults,
        economics: { resell: 0, refer: 0, influence: 0, buildOn: 0 },
      }).length,
      1,
    );
    assert.throws(() => generateDesign({ ...scenario, ask: "" }, scenario.defaults));
  });

  it("replays saved version snapshots with their recorded engine and preserves prior output", () => {
    const savedVersion = {
      engineVersion: DESIGN_ENGINE_VERSION,
      scenarioSnapshot: structuredClone(scenario),
      settingsSnapshot: structuredClone(scenario.defaults),
      outputSnapshot: generateDesign(scenario, scenario.defaults),
    };

    assert.deepEqual(
      regenerateDesign(
        savedVersion.scenarioSnapshot,
        savedVersion.settingsSnapshot,
        savedVersion.engineVersion,
      ),
      savedVersion.outputSnapshot,
    );

    const revisedSettings = {
      ...savedVersion.settingsSnapshot,
      economics: { resell: 80, refer: 20, influence: 0, buildOn: 0 },
    };
    const revisedOutput = generateDesign(savedVersion.scenarioSnapshot, revisedSettings);
    assert.notDeepEqual(revisedOutput, savedVersion.outputSnapshot);
    assert.deepEqual(
      regenerateDesign(
        savedVersion.scenarioSnapshot,
        savedVersion.settingsSnapshot,
        savedVersion.engineVersion,
      ),
      savedVersion.outputSnapshot,
    );
  });

  it("does not silently replay an unsupported engine version", () => {
    assert.throws(
      () => regenerateDesign(scenario, scenario.defaults, "0.9.0"),
      /Unsupported design engine version: 0.9.0/,
    );
  });
});
