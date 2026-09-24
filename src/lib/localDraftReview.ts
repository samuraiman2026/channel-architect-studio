export type LocalEndorsement = { name: string; at: string };

function parseEndorsement(value: unknown): LocalEndorsement | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as { name?: unknown; at?: unknown };
  if (
    typeof candidate.name !== "string" ||
    !candidate.name.trim() ||
    typeof candidate.at !== "string" ||
    !Number.isFinite(Date.parse(candidate.at))
  ) {
    return undefined;
  }
  return { name: candidate.name.trim().slice(0, 120), at: candidate.at };
}

export function normalizeLocalDraftReview(
  currentEndorsement: unknown,
  legacyApproval: unknown,
): { status: "draft"; localEndorsement?: LocalEndorsement } {
  const localEndorsement = parseEndorsement(currentEndorsement) ?? parseEndorsement(legacyApproval);
  return localEndorsement ? { status: "draft", localEndorsement } : { status: "draft" };
}
