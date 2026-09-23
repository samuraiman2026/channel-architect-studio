import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — The Partner Brief" },
      {
        name: "description",
        content:
          "About The Partner Brief — a tool that generates partner program designs for SaaS companies.",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl text-primary tracking-tight">
            The Partner Brief
          </Link>
          <nav className="text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl sm:text-5xl text-primary mb-8">
          About The Partner Brief
        </h1>
        <div className="space-y-5 text-foreground leading-relaxed">
          <p>
            The Partner Brief is a partner-program planning tool authored by Pranjal. It turns your
            company context, preferred partner types, planning emphasis, and stage into a first
            design for review.
          </p>
          <p>
            This version uses explicit rules, not an AI model or externally validated benchmarks.
            Its output is a set of hypotheses, not proof that a partner motion will work. Use it to
            make operating choices visible, then validate those choices with actual customer and
            partner evidence.
          </p>
          <p className="text-sm text-muted-foreground italic pt-4">
            Drafts are saved only in this browser. Shared workspaces, evidence records, approvals,
            and operational workflows are planned for a later version.
          </p>
        </div>
      </main>
    </div>
  );
}
