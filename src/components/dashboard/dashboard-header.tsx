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
    <div className="flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          Concrete Operations
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex flex-wrap gap-3 max-sm:w-full max-sm:[&>*]:flex-1">
          {action}
        </div>
      ) : null}
    </div>
  );
}
