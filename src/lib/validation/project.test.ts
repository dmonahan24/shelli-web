import { describe, expect, it } from "bun:test";
import { projectSchema } from "@/lib/validation/project";

describe("project validation", () => {
  it("accepts valid project payloads", () => {
    const result = projectSchema.parse({
      name: "Riverside Warehouse Slab",
      address: "1450 River Bend Rd, Albany, NY",
      status: "active",
      dateStarted: "2026-03-14",
      estimatedCompletionDate: "2026-05-01",
      estimatedTotalConcrete: 640,
    });

    expect(result.status).toBe("active");
  });

  it("rejects negative concrete values", () => {
    const result = projectSchema.safeParse({
      name: "Riverside Warehouse Slab",
      address: "1450 River Bend Rd, Albany, NY",
      status: "active",
      dateStarted: "2026-03-14",
      estimatedCompletionDate: "2026-05-01",
      estimatedTotalConcrete: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid project status values", () => {
    const result = projectSchema.safeParse({
      name: "Riverside Warehouse Slab",
      address: "1450 River Bend Rd, Albany, NY",
      status: "paused",
      dateStarted: "2026-03-14",
      estimatedCompletionDate: "2026-05-01",
      estimatedTotalConcrete: 640,
    });

    expect(result.success).toBe(false);
  });

  it("rejects completion dates before the start date", () => {
    const result = projectSchema.safeParse({
      name: "Riverside Warehouse Slab",
      address: "1450 River Bend Rd, Albany, NY",
      status: "active",
      dateStarted: "2026-03-14",
      estimatedCompletionDate: "2026-03-01",
      estimatedTotalConcrete: 640,
    });

    expect(result.success).toBe(false);
  });
});
