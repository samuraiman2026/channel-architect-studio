import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeLocalDraftReview } from "./localDraftReview";

describe("browser-local review migration", () => {
  it("keeps legacy approvals unapproved while preserving them as local endorsements", () => {
    const result = normalizeLocalDraftReview(undefined, {
      name: "Reviewer",
      at: "2026-09-23T19:56:54.000Z",
    });

    assert.deepEqual(result, {
      status: "draft",
      localEndorsement: {
        name: "Reviewer",
        at: "2026-09-23T19:56:54.000Z",
      },
    });
  });

  it("prefers a valid local endorsement and discards malformed stored review data", () => {
    assert.deepEqual(
      normalizeLocalDraftReview(
        { name: "  Partner Lead  ", at: "2026-09-24T10:00:00.000Z" },
        { name: "Old Reviewer", at: "not-a-date" },
      ),
      {
        status: "draft",
        localEndorsement: {
          name: "Partner Lead",
          at: "2026-09-24T10:00:00.000Z",
        },
      },
    );
    assert.deepEqual(
      normalizeLocalDraftReview({ name: { invalid: true }, at: "not-a-date" }, null),
      { status: "draft" },
    );
  });
});
