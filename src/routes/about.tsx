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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. The Partner Brief
            is a tool authored by Pranjal that produces a credible v1 partner program
            design for a SaaS company, grounded in a three-axis framework: economic
            role mix, primary partner archetypes, and vendor GTM stage.
          </p>
          <p>
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
            ex ea commodo consequat. The full writeup, including a defense of the
            three-axis framework and a comparison against published programs at
            Snowflake and HubSpot, will appear here.
          </p>
          <p className="text-sm text-muted-foreground italic pt-4">
            (Real writeup forthcoming.)
          </p>
        </div>
      </main>
    </div>
  );
}
