export const floorTypeValues = [
  "foundation",
  "ground",
  "standard",
  "basement",
  "roof",
  "other",
] as const;

export const pourCategoryValues = [
  "footings",
  "grade_beams",
  "slab",
  "columns",
  "shear_walls",
  "core_walls",
  "stairs",
  "elevator_pit",
  "deck",
  "other",
] as const;

export const pourTypeStatusValues = [
  "not_started",
  "in_progress",
  "completed",
] as const;

export const pourTypePresetBundleValues = ["foundation", "standard"] as const;

export type FloorType = (typeof floorTypeValues)[number];
export type PourCategory = (typeof pourCategoryValues)[number];
export type PourTypeStatus = (typeof pourTypeStatusValues)[number];
export type PourTypePresetBundle = (typeof pourTypePresetBundleValues)[number];

export const pourTypePresetBundles: Record<
  PourTypePresetBundle,
  Array<{ name: string; pourCategory: PourCategory }>
> = {
  foundation: [
    { name: "Footings", pourCategory: "footings" },
    { name: "Grade Beams", pourCategory: "grade_beams" },
    { name: "Slab", pourCategory: "slab" },
    { name: "Elevator Pit", pourCategory: "elevator_pit" },
  ],
  standard: [
    { name: "Slab", pourCategory: "slab" },
    { name: "Columns", pourCategory: "columns" },
    { name: "Shear Walls", pourCategory: "shear_walls" },
    { name: "Core Walls", pourCategory: "core_walls" },
    { name: "Stairs", pourCategory: "stairs" },
  ],
};

export function getDefaultFloorName(
  floorType: FloorType,
  levelNumber?: number | null,
  customName?: string | null
) {
  const trimmedCustomName = customName?.trim();
  if (trimmedCustomName) {
    return trimmedCustomName;
  }

  switch (floorType) {
    case "foundation":
      return "Foundation";
    case "ground":
      return "Ground Level";
    case "standard":
      return `Level ${levelNumber ?? ""}`.trim();
    case "basement":
      return "Basement";
    case "roof":
      return "Roof";
    case "other":
    default:
      return "Other Floor";
  }
}

export function getDefaultFloorDisplayOrder(
  floorType: FloorType,
  levelNumber?: number | null
) {
  switch (floorType) {
    case "foundation":
      return 100;
    case "basement":
      return 150;
    case "ground":
      return 200;
    case "standard":
      return 200 + (levelNumber ?? 0);
    case "roof":
      return 10000;
    case "other":
    default:
      return 5000;
  }
}

export function getPourCategoryLabel(category: PourCategory) {
  return category.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getPourTypeStatusLabel(status: PourTypeStatus) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getPourTypePresetBundleLabel(bundle: PourTypePresetBundle) {
  return bundle === "foundation" ? "Foundation Bundle" : "Ground and Standard Bundle";
}

export function getRemainingConcrete(estimatedConcrete: number, actualConcrete: number) {
  return Math.max(estimatedConcrete - actualConcrete, 0);
}
