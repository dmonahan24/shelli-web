import { describe, expect, it } from "bun:test";
import { createPourEventSchema } from "@/lib/validation/pour-event";

const basePourEvent = {
  projectId: "5f1c7a0e-8b4d-4a53-9c1e-2d7f3b6a9e10",
  pourDate: "2026-03-14",
  locationDescription: "Level 2 deck, pour 3",
};

describe("pour event validation", () => {
  it("accepts concrete amounts with up to 2 decimal places", () => {
    for (const concreteAmount of [42, 42.5, 42.29, "12.07"]) {
      const result = createPourEventSchema.safeParse({ ...basePourEvent, concreteAmount });

      expect(result.success).toBe(true);
    }
  });

  it("rejects concrete amounts with more than 2 decimal places", () => {
    for (const concreteAmount of [42.123, 1.005, "0.001"]) {
      const result = createPourEventSchema.safeParse({ ...basePourEvent, concreteAmount });

      expect(result.success).toBe(false);
    }
  });
});
