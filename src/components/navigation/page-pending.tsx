import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className={compact ? "h-8 w-48" : "h-10 w-64"} />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

function SummaryGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="rounded-[24px] border-border/80 bg-card/90 shadow-sm">
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableCardSkeleton({
  rows = 5,
  titleWidth = "w-40",
}: {
  rows?: number;
  titleWidth?: string;
}) {
  return (
    <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>
          <Skeleton className={`h-6 ${titleWidth}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-2xl" />
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardPendingPage() {
  return (
    <div className="space-y-6">
      <SummaryGridSkeleton />
      <TableCardSkeleton rows={5} titleWidth="w-48" />
      <TableCardSkeleton rows={4} titleWidth="w-36" />
    </div>
  );
}

export function ListPagePending() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton compact />
      <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
        <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </CardContent>
      </Card>
      <TableCardSkeleton rows={6} titleWidth="w-44" />
    </div>
  );
}

export function DetailPagePending() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <SummaryGridSkeleton />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <TableCardSkeleton rows={5} titleWidth="w-44" />
          <TableCardSkeleton rows={4} titleWidth="w-40" />
        </div>
        <div className="space-y-6">
          <TableCardSkeleton rows={3} titleWidth="w-32" />
          <TableCardSkeleton rows={3} titleWidth="w-36" />
        </div>
      </div>
    </div>
  );
}

export function FormPagePending() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="sticky bottom-4 flex justify-end">
        <div className="rounded-2xl border border-border/60 bg-background/90 p-3 shadow-lg backdrop-blur">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsPendingPage() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton compact />
      <SummaryGridSkeleton />
      <div className="grid gap-6 xl:grid-cols-2">
        <TableCardSkeleton rows={4} titleWidth="w-40" />
        <TableCardSkeleton rows={4} titleWidth="w-40" />
      </div>
      <TableCardSkeleton rows={4} titleWidth="w-36" />
    </div>
  );
}

export function FieldPendingPage() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton compact />
      <SummaryGridSkeleton count={3} />
      <TableCardSkeleton rows={4} titleWidth="w-44" />
      <TableCardSkeleton rows={3} titleWidth="w-40" />
    </div>
  );
}

export function AdminPendingPage() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <SummaryGridSkeleton count={3} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <TableCardSkeleton rows={4} titleWidth="w-40" />
        <div className="space-y-6">
          <TableCardSkeleton rows={3} titleWidth="w-36" />
          <TableCardSkeleton rows={3} titleWidth="w-40" />
        </div>
      </div>
    </div>
  );
}

export const ListPendingPage = ListPagePending;
export const DetailPendingPage = DetailPagePending;
export const FormPendingPage = FormPagePending;
