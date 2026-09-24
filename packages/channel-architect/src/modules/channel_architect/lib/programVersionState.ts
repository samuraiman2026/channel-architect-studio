export type ProgramReviewDecision = "approved" | "rejected";

export function getProgramVersionStateLabel(
  versionNumber: number,
  currentVersionNumber: number,
  decision?: ProgramReviewDecision,
): string {
  const currentState = decision ?? "draft";
  if (versionNumber === currentVersionNumber) return `${currentState} · current`;
  return decision ? `${decision} · superseded` : "superseded · pending review";
}
