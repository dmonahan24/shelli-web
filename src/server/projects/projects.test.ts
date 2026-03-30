import { describe, expect, it } from "bun:test";
import { createProjectSchema, updateProjectSchema } from "@/lib/validation/project";

describe("project validation", () => {
  it("accepts a valid project payload", () => {
    const result = createProjectSchema.safeParse({
      name: "North Tower Parking Deck",
      address: "12 Granite Ave, Rochester, NY",
      status: "active",
      description: "Deck placement and sequencing",
      projectCode: "ROC-012-DECK",
      dateStarted: "2026-03-27",
      estimatedCompletionDate: "2026-06-15",
      estimatedTotalConcrete: 520,
    });

    expect(result.success).toBe(true);
  });

  it("rejects projects whose estimated completion precedes the start date", () => {
    const result = updateProjectSchema.safeParse({
      name: "North Tower Parking Deck",
      address: "12 Granite Ave, Rochester, NY",
      status: "active",
      description: "",
      projectCode: "",
      dateStarted: "2026-06-15",
      estimatedCompletionDate: "2026-03-27",
      estimatedTotalConcrete: 520,
    });

    expect(result.success).toBe(false);
  });
});
