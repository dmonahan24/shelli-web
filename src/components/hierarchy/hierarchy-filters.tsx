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
  floorTypeValues,
  getPourCategoryLabel,
  getPourTypeStatusLabel,
  pourCategoryValues,
  pourTypeStatusValues,
} from "@/lib/hierarchy";

function sortLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replaceAll("_", " ");
}

export function BuildingsManagementToolbar({
  onReset,
  onSearchChange,
  onSortByChange,
  onSortDirChange,
  search,
}: {
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  search: {
    q: string;
    sortBy: string;
    sortDir: string;
  };
}) {
  return (
    <div className="space-y-3 rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          placeholder="Search building name or code"
          value={search.q}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select value={search.sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {["displayOrder", "name", "estimatedConcreteTotal", "actualConcreteTotal", "floorCount"].map((value) => (
              <SelectItem key={value} value={value}>
                {sortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sortDir} onValueChange={onSortDirChange}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function FloorsManagementToolbar({
  onFilterChange,
  onReset,
  onSearchChange,
  onSortByChange,
  onSortDirChange,
  search,
}: {
  onFilterChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  search: {
    floorType: string;
    q: string;
    sortBy: string;
    sortDir: string;
  };
}) {
  return (
    <div className="space-y-3 rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          placeholder="Search floor name"
          value={search.q}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select value={search.floorType} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Floor type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All floor types</SelectItem>
            {floorTypeValues.map((value) => (
              <SelectItem key={value} value={value}>
                {sortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {["displayOrder", "name", "levelNumber", "estimatedConcreteTotal", "actualConcreteTotal"].map((value) => (
              <SelectItem key={value} value={value}>
                {sortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sortDir} onValueChange={onSortDirChange}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function PourTypesManagementToolbar({
  onCategoryChange,
  onReset,
  onSearchChange,
  onSortByChange,
  onSortDirChange,
  onStatusChange,
  search,
}: {
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: string) => void;
  onSortDirChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  search: {
    category: string;
    q: string;
    sortBy: string;
    sortDir: string;
    status: string;
  };
}) {
  return (
    <div className="space-y-3 rounded-[24px] border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row">
        <Input
          placeholder="Search name, category, or notes"
          value={search.q}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select value={search.category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {pourCategoryValues.map((value) => (
              <SelectItem key={value} value={value}>
                {getPourCategoryLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full xl:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {pourTypeStatusValues.map((value) => (
              <SelectItem key={value} value={value}>
                {getPourTypeStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full xl:w-56">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {["displayOrder", "name", "estimatedConcrete", "actualConcrete", "updatedAt"].map((value) => (
              <SelectItem key={value} value={value}>
                {sortLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.sortDir} onValueChange={onSortDirChange}>
          <SelectTrigger className="w-full xl:w-44">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
