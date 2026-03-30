import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  projectProgressValues,
  projectSortByValues,
} from "@/lib/validation/project-list";
import { projectStatusValues } from "@/lib/validation/project";

export function ProjectsToolbar({
  onDateChange,
  onPageSizeChange,
  onProgressChange,
  onReset,
  onSearchChange,
  onSortByChange,
  onSortDirChange,
  onStatusChange,
  search,
}: {
  onDateChange: (
    field: "startDateFrom" | "startDateTo" | "estimatedDateFrom" | "estimatedDateTo",
    value: string
  ) => void;
  onPageSizeChange: (value: string) => void;
  onProgressChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  search: {
    pageSize: number;
    progress: string;
    q?: string;
    estimatedDateFrom?: string;
    estimatedDateTo?: string;
    startDateFrom?: string;
    startDateTo?: string;
    sortBy: string;
    sortDir: string;
    status: string;
  };
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-border/70 bg-card/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Search and sort jobsite work, track concrete progress, and deep-link the exact list
            state your team needs to review.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
          <AddProjectDialog />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <ProjectsSearchInput value={search.q ?? ""} onChange={onSearchChange} />
        <ProjectStatusFilter value={search.status} onChange={onStatusChange} />
        <ProjectProgressFilter value={search.progress} onChange={onProgressChange} />
        <ProjectSortSelect value={search.sortBy} onChange={onSortByChange} />
        <ProjectSortDirectionSelect value={search.sortDir} onChange={onSortDirChange} />
        <ProjectPageSizeSelect value={String(search.pageSize)} onChange={onPageSizeChange} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ProjectDateFilter
          label="Start Date From"
          value={search.startDateFrom ?? ""}
          onChange={(value) => onDateChange("startDateFrom", value)}
        />
        <ProjectDateFilter
          label="Start Date To"
          value={search.startDateTo ?? ""}
          onChange={(value) => onDateChange("startDateTo", value)}
        />
        <ProjectDateFilter
          label="Estimated Finish From"
          value={search.estimatedDateFrom ?? ""}
          onChange={(value) => onDateChange("estimatedDateFrom", value)}
        />
        <ProjectDateFilter
          label="Estimated Finish To"
          value={search.estimatedDateTo ?? ""}
          onChange={(value) => onDateChange("estimatedDateTo", value)}
        />
      </div>
      <ProjectFilterChips search={search} onReset={onReset} />
    </div>
  );
}

export function ProjectsSearchInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return <Input placeholder="Search name, address, or code" value={value} onChange={(event) => onChange(event.target.value)} />;
}

export function ProjectStatusFilter({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {projectStatusValues.map((status) => (
          <SelectItem key={status} value={status}>
            {status.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectProgressFilter({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Progress" />
      </SelectTrigger>
      <SelectContent>
        {projectProgressValues.map((progress) => (
          <SelectItem key={progress} value={progress}>
            {progress.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectSortSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Sort By" />
      </SelectTrigger>
      <SelectContent>
        {projectSortByValues.map((sortBy) => (
          <SelectItem key={sortBy} value={sortBy}>
            {sortBy.replace(/([A-Z])/g, " $1")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProjectSortDirectionSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Direction" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="desc">Descending</SelectItem>
        <SelectItem value="asc">Ascending</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function ProjectPageSizeSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
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
  );
}

export function ProjectFilterChips({
  onReset,
  search,
}: {
  onReset: () => void;
  search: {
    estimatedDateFrom?: string;
    estimatedDateTo?: string;
    progress: string;
    q?: string;
    startDateFrom?: string;
    startDateTo?: string;
    sortBy: string;
    sortDir: string;
    status: string;
  };
}) {
  const activeFilters = [
    search.q ? `Search: ${search.q}` : null,
    search.status !== "all" ? `Status: ${search.status.replaceAll("_", " ")}` : null,
    search.progress !== "all" ? `Progress: ${search.progress.replaceAll("_", " ")}` : null,
    search.startDateFrom ? `Start >= ${search.startDateFrom}` : null,
    search.startDateTo ? `Start <= ${search.startDateTo}` : null,
    search.estimatedDateFrom ? `Finish >= ${search.estimatedDateFrom}` : null,
    search.estimatedDateTo ? `Finish <= ${search.estimatedDateTo}` : null,
    `Sort: ${search.sortBy} ${search.sortDir}`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs text-muted-foreground"
        >
          {chip}
        </span>
      ))}
      <ResetProjectFiltersButton onClick={onReset} />
    </div>
  );
}

export function ResetProjectFiltersButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      Clear
    </Button>
  );
}

export function ProjectDateFilter({
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
