import { describe, expect, it } from "bun:test";
import {
  bulkCreateFloorsSchema,
  createFloorSchema,
  updateFloorSchema,
} from "@/lib/validation/floor";

describe("floor validation", () => {
  it("accepts a valid standard floor payload", () => {
    const result = createFloorSchema.safeParse({
      buildingId: crypto.randomUUID(),
      floorType: "standard",
      levelNumber: 5,
      customName: "",
      displayOrder: 205,
    });

    expect(result.success).toBe(true);
  });

  it("rejects standard floors without a level number", () => {
    const result = updateFloorSchema.safeParse({
      floorId: crypto.randomUUID(),
      floorType: "standard",
      customName: "",
      displayOrder: 205,
    });

    expect(result.success).toBe(false);
  });

  it("rejects level numbers for non-standard floors", () => {
    const result = createFloorSchema.safeParse({
      buildingId: crypto.randomUUID(),
      floorType: "ground",
      levelNumber: 2,
      customName: "",
      displayOrder: 200,
    });

    expect(result.success).toBe(false);
  });

  it("accepts bulk floor creation with hierarchy presets", () => {
    const result = bulkCreateFloorsSchema.safeParse({
      buildingId: crypto.randomUUID(),
      includeFoundation: true,
      includeGroundLevel: true,
      topStandardLevel: 8,
    });

    expect(result.success).toBe(true);
  });
});
