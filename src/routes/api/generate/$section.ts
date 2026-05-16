import { createFileRoute } from "@tanstack/react-router";
import { MOCK_DATA } from "@/lib/mockData";
import type { ScenarioId, SectionKey } from "@/lib/types";

const VALID_SECTIONS: SectionKey[] = [
  "exec-summary",
  "strategic-rationale",
  "ipp",
  "tiering",
  "economics",
  "motions",
  "enablement",
  "launch-plan",
  "risks",
];

// Single dynamic handler covers all 9 endpoints:
//   /api/generate/exec-summary, /api/generate/tiering, etc.
// (Adapted from the spec's 9 separate Next.js route handlers — same contract.)
export const Route = createFileRoute("/api/generate/$section")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const section = params.section as SectionKey;
        if (!VALID_SECTIONS.includes(section)) {
          return new Response(JSON.stringify({ error: "Unknown section" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { scenario?: ScenarioId } = {};
        try {
          body = await request.json();
        } catch {
          // ignore
        }
        const scenario = body.scenario;
        if (!scenario || !(scenario in MOCK_DATA)) {
          return new Response(JSON.stringify({ error: "Invalid scenario" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const content = MOCK_DATA[scenario][section];
        return new Response(JSON.stringify({ section: content }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
