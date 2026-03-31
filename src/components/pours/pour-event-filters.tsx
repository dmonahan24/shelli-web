import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveFiltersDrawer } from "@/components/ui/responsive-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { summarizeActiveFilters } from "@/lib/responsive";

export function PourEventFilters({
  onDateChange,
  onPageSizeChange,
  onSearchChange,
  onSortByChange,
  onSortDirChange,
  onAmountChange,
  query,
}: {
  onAmountChange: (field: "minAmount" | "maxAmount", value: string) => void;
  onDateChange: (field: "dateFrom" | "dateTo", value: string) => void;
  onPageSizeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  query: {
    dateFrom?: string;
    dateTo?: string;
    maxAmount?: number;
    minAmount?: number;
    pageSize: number;
    q?: string;
    sortBy: string;
    sortDir: string;
  };
}) {
  const activeFilters = [
    query.q ? `Search: ${query.q}` : null,
    query.dateFrom ? `Date >= ${query.dateFrom}` : null,
    query.dateTo ? `Date <= ${query.dateTo}` : null,
    query.minAmount ? `Amount >= ${query.minAmount}` : null,
    query.maxAmount ? `Amount <= ${query.maxAmount}` : null,
    `Sort: ${query.sortBy} ${query.sortDir}`,
    `Rows: ${query.pageSize}`,
  ];

  return (
    <ResponsiveFiltersDrawer
      title="Pour log filters"
      description="Search and refine the pour event log by date range, volume, sort order, and page size."
      summary={summarizeActiveFilters(activeFilters, "Search, date, and amount filters")}
    >
      <div className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-3">
          <Input
            placeholder="Search ticket, supplier, mix, or location"
            value={query.q ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Select value={query.sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pourDate">Pour Date</SelectItem>
              <SelectItem value="concreteAmount">Concrete Amount</SelectItem>
            </SelectContent>
          </Select>
          <Select value={query.sortDir} onValueChange={onSortDirChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          <PourEventDateFilter
            label="Date From"
            value={query.dateFrom ?? ""}
            onChange={(value) => onDateChange("dateFrom", value)}
          />
          <PourEventDateFilter
            label="Date To"
            value={query.dateTo ?? ""}
            onChange={(value) => onDateChange("dateTo", value)}
          />
          <PourAmountRangeFilter
            label="Min Amount"
            value={query.minAmount?.toString() ?? ""}
            onChange={(value) => onAmountChange("minAmount", value)}
          />
          <PourAmountRangeFilter
            label="Max Amount"
            value={query.maxAmount?.toString() ?? ""}
            onChange={(value) => onAmountChange("maxAmount", value)}
          />
          <Select value={String(query.pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ResponsiveFiltersDrawer>
  );
}

export function PourEventDateFilter({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function PourAmountRangeFilter({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function PourEventsPagination({
  onNext,
  onPrevious,
  page,
  pageCount,
}: {
  onNext: () => void;
  onPrevious: () => void;
  page: number;
  pageCount: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2 max-sm:[&>*]:flex-1">
        <Button variant="outline" onClick={onPrevious} disabled={page <= 1}>
          Previous
        </Button>
        <Button variant="outline" onClick={onNext} disabled={page >= pageCount}>
          Next
        </Button>
      </div>
    </div>
  );
}
