import { describe, expect, it } from "bun:test";
import {
  applyPourTypePresetBundleSchema,
  createPourTypeSchema,
  updatePourTypeSchema,
} from "@/lib/validation/pour-type";

describe("pour type validation", () => {
  it("accepts a valid pour type payload", () => {
    const result = createPourTypeSchema.safeParse({
      floorId: crypto.randomUUID(),
      name: "Slab",
      pourCategory: "slab",
      estimatedConcrete: 120,
      actualConcrete: 40,
      status: "in_progress",
      notes: "Phase 1 deck placement",
      displayOrder: 10,
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative concrete values", () => {
    const result = updatePourTypeSchema.safeParse({
      pourTypeId: crypto.randomUUID(),
      name: "Columns",
      pourCategory: "columns",
      estimatedConcrete: 40,
      actualConcrete: -5,
      status: "in_progress",
      notes: "",
      displayOrder: 20,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a preset bundle request", () => {
    const result = applyPourTypePresetBundleSchema.safeParse({
      floorId: crypto.randomUUID(),
      bundle: "foundation",
    });

    expect(result.success).toBe(true);
  });
});
