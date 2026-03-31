import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, HardHat, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(230,190,138,0.16),_transparent_35%),linear-gradient(180deg,_rgba(246,242,235,1)_0%,_rgba(255,255,255,1)_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <HardHat className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Shelli Concrete Tracker</p>
              <p className="text-xs text-muted-foreground">Construction operations for field teams</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link to="/auth/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/create-account">Create Account</Link>
            </Button>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-8">
            <div className="space-y-5">
              <p className="text-sm font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                Production-ready construction tracking
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Track every project, pour milestone, and concrete total with clarity.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Give supers, PMs, QC teams, and operations staff a shared source of truth for schedules,
                progress, and project records.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/auth/create-account">
                  Create Account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth/sign-in">Sign In</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard
                icon={<ClipboardList className="size-5" />}
                title="Project visibility"
                body="See planned work, active jobs, and concrete quantities in one dashboard."
              />
              <FeatureCard
                icon={<Workflow className="size-5" />}
                title="Field-first workflows"
                body="Fast forms for teams who need to update records from tablets and phones."
              />
              <FeatureCard
                icon={<ShieldCheck className="size-5" />}
                title="Trusted records"
                body="User-scoped data and secure auth flows for production use."
              />
            </div>
          </section>

          <section className="grid gap-5">
            <Card className="rounded-[32px] border-border/70 bg-stone-950 text-stone-50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl">Today’s operations snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-2xl bg-white/5 p-5">
                  <p className="text-sm text-stone-300">Active projects</p>
                  <p className="mt-2 text-4xl font-semibold">12</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-sm text-stone-300">Concrete poured</p>
                    <p className="mt-2 text-2xl font-semibold">428.50 CY</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-5">
                    <p className="text-sm text-stone-300">Projects at risk</p>
                    <p className="mt-2 text-2xl font-semibold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
