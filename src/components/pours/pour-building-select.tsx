import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Radix Select does not allow an empty item value, so "no building" uses a sentinel.
const NO_BUILDING_VALUE = "__none__";

export type PourBuildingOption = {
  id: string;
  name: string;
  code: string | null;
};

export function formatPourBuildingLabel(building: { name: string; code: string | null }) {
  return building.code ? `${building.code} · ${building.name}` : building.name;
}

export function PourBuildingSelect({
  buildings,
  onChange,
  value,
}: {
  buildings: PourBuildingOption[];
  onChange: (value: string) => void;
  value: string | undefined;
}) {
  const hasBuildings = buildings.length > 0;

  return (
    <Select
      value={value || NO_BUILDING_VALUE}
      onValueChange={(nextValue) => onChange(nextValue === NO_BUILDING_VALUE ? "" : nextValue)}
      disabled={!hasBuildings}
    >
      <SelectTrigger className="h-11">
        <SelectValue placeholder={hasBuildings ? "Select a building" : "No buildings on this project"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_BUILDING_VALUE}>
          {hasBuildings ? "No building" : "No buildings on this project"}
        </SelectItem>
        {buildings.map((building) => (
          <SelectItem key={building.id} value={building.id}>
            {formatPourBuildingLabel(building)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
