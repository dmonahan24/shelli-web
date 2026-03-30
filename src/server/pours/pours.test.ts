import { describe, expect, it } from "bun:test";
import {
  createPourEventSchema,
  updatePourEventSchema,
} from "@/lib/validation/pour-event";

describe("pour validation", () => {
  it("accepts a complete pour-event payload", () => {
    const result = createPourEventSchema.safeParse({
      projectId: crypto.randomUUID(),
      pourDate: "2026-03-29",
      concreteAmount: 20,
      unit: "cubic_yards",
      locationDescription: "South wall footing",
      mixType: "4,000 PSI pump mix",
      supplierName: "Empire Ready Mix",
      ticketNumber: "TK-11482",
      weatherNotes: "Cool and dry",
      crewNotes: "Placed without delay",
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative concrete amounts on updates", () => {
    const result = updatePourEventSchema.safeParse({
      id: crypto.randomUUID(),
      projectId: crypto.randomUUID(),
      pourDate: "2026-03-29",
      concreteAmount: -1,
      unit: "cubic_yards",
      locationDescription: "South wall footing",
      mixType: "",
      supplierName: "",
      ticketNumber: "",
      weatherNotes: "",
      crewNotes: "",
    });

    expect(result.success).toBe(false);
  });
});
