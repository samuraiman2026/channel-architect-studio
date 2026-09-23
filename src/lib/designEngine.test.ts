import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "./scenarios";
import { generateDesign, validateDesignInputs } from "./designEngine";

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
});
