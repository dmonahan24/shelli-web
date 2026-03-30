import type { ReactNode } from "react";

export function DashboardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          Concrete Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
