import { Button } from "@/components/ui/button";
import { DesktopOnly, MobileOnly } from "@/components/ui/responsive-layout";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectsPagination({
  onNext,
  onPageSizeChange,
  onPrevious,
  page,
  pageCount,
  pageSize,
}: {
  onNext: () => void;
  onPageSizeChange: (value: string) => void;
  onPrevious: () => void;
  page: number;
  pageCount: number;
  pageSize: number;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/90 p-4 shadow-sm">
      <DesktopOnly>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <RowsPerPageSelect value={String(pageSize)} onChange={onPageSizeChange} />
          <Pagination className="mx-0 w-auto justify-start md:justify-center">
            <PaginationContent>
              <PaginationItem>
                <Button variant="outline" onClick={onPrevious} disabled={page <= 1}>
                  Previous
                </Button>
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {pageCount}
                </span>
              </PaginationItem>
              <PaginationItem>
                <Button variant="outline" onClick={onNext} disabled={page >= pageCount}>
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </DesktopOnly>
      <MobileOnly>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            <RowsPerPageSelect value={String(pageSize)} onChange={onPageSizeChange} />
          </div>
          <div className="flex gap-2 [&>*]:flex-1">
            <Button variant="outline" onClick={onPrevious} disabled={page <= 1}>
              Previous
            </Button>
            <Button variant="outline" onClick={onNext} disabled={page >= pageCount}>
              Next
            </Button>
          </div>
        </div>
      </MobileOnly>
    </div>
  );
}

export function ResultsSummary({
  page,
  pageSize,
  totalCount,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  if (totalCount === 0) {
    return <p className="text-sm text-muted-foreground">No matching projects found.</p>;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <p className="text-sm text-muted-foreground">
      Showing {start}-{end} of {totalCount} projects
    </p>
  );
}

export function RowsPerPageSelect({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Rows per page</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-24 sm:w-28">
          <SelectValue placeholder="Rows" />
        </SelectTrigger>
        <SelectContent>
          {[10, 25, 50].map((pageSize) => (
            <SelectItem key={pageSize} value={String(pageSize)}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
