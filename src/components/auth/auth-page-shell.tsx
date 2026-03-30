import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HardHat, LayoutGrid, ShieldCheck, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(230,190,138,0.18),_transparent_40%),linear-gradient(180deg,_rgba(246,242,235,1)_0%,_rgba(255,255,255,1)_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div className="flex flex-col justify-between rounded-[32px] border border-border/70 bg-stone-950 p-8 text-stone-50 shadow-2xl lg:p-10">
          <div className="space-y-8">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-sm font-medium tracking-[0.18em] text-stone-300 uppercase"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/90 text-primary-foreground shadow-lg">
                <HardHat className="size-5" />
              </span>
              Concrete Pour Tracker
            </Link>
            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold tracking-[0.3em] text-stone-400 uppercase">
                Field-ready operations
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Keep every pour, project, and crew update in one place.
              </h1>
              <p className="text-base leading-7 text-stone-300">
                Built for supers, project managers, QC teams, and office staff who
                need fast status visibility without sacrificing an audit trail.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard
              icon={<LayoutGrid className="size-5" />}
              title="Daily visibility"
              body="See active projects, scheduled work, and concrete progress at a glance."
            />
            <FeatureCard
              icon={<Truck className="size-5" />}
              title="Field capture"
              body="Keep project records current with forms designed for real jobsite workflows."
            />
            <FeatureCard
              icon={<ShieldCheck className="size-5" />}
              title="Trusted records"
              body="Preserve clean, user-scoped data for operations review and billing support."
            />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-xl backdrop-blur">
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-3 inline-flex rounded-xl bg-white/10 p-2 text-stone-100">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-stone-50">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-300">{body}</p>
    </div>
  );
}
