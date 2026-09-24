import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getProgramVersionStateLabel } from "../../packages/channel-architect/src/modules/channel_architect/lib/programVersionState";

describe("program version governance labels", () => {
  it("distinguishes current draft, approved, and rejected versions", () => {
    assert.equal(getProgramVersionStateLabel(3, 3), "draft · current");
    assert.equal(getProgramVersionStateLabel(3, 3, "approved"), "approved · current");
    assert.equal(getProgramVersionStateLabel(3, 3, "rejected"), "rejected · current");
  });

  it("shows when an unreviewed or decided version has been superseded", () => {
    assert.equal(getProgramVersionStateLabel(2, 3), "superseded · pending review");
    assert.equal(getProgramVersionStateLabel(2, 3, "approved"), "approved · superseded");
    assert.equal(getProgramVersionStateLabel(2, 3, "rejected"), "rejected · superseded");
  });
});
