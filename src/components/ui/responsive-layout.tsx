import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DesktopOnly({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

export function MobileOnly({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("md:hidden", className)}>{children}</div>;
}

export function ResponsiveTableLayout({
  desktop,
  mobile,
}: {
  desktop: React.ReactNode;
  mobile: React.ReactNode;
}) {
  return (
    <>
      <DesktopOnly>{desktop}</DesktopOnly>
      <MobileOnly>{mobile}</MobileOnly>
    </>
  );
}

export function MobileCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

export function MobileCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border-border/70 bg-card/95 shadow-sm", className)}>
      <CardContent className="space-y-4 p-4">{children}</CardContent>
    </Card>
  );
}

export function MobileCardHeader({
  title,
  subtitle,
  badge,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <div className="font-medium leading-6">{title}</div>
        {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

export function MobileMetricGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>;
}

export function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5">
      <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function MobileActionRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

export function ResponsiveFiltersDrawer({
  children,
  description,
  summary,
  title = "Filters",
  triggerLabel = "Filters",
}: {
  children: React.ReactNode;
  description?: string;
  summary: string;
  title?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <DesktopOnly>{children}</DesktopOnly>
      <MobileOnly>
        <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">Filters</CardTitle>
                <CardDescription className="leading-5">{summary}</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
                {triggerLabel}
              </Button>
            </div>
          </CardHeader>
        </Card>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[85vh] rounded-t-[28px]">
            <DrawerHeader className="border-b border-border/70 px-4 pb-4">
              <DrawerTitle>{title}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
              {children}
            </div>
          </DrawerContent>
        </Drawer>
      </MobileOnly>
    </>
  );
}
