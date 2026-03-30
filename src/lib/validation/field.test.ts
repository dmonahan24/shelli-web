import { describe, expect, it } from "bun:test";
import { quickPourSchema } from "@/lib/validation/field";

describe("field quick pour validation", () => {
  it("accepts a mobile quick pour payload", () => {
    const result = quickPourSchema.safeParse({
      projectId: crypto.randomUUID(),
      pourDate: "2026-03-30",
      concreteAmount: 22.5,
      locationDescription: "South slab strip",
      mixType: "4000 PSI",
      supplierName: "Empire Ready Mix",
      ticketNumber: "TK-4401",
      crewNotes: "Placed before lunch",
      weatherNotes: "Clear",
      clientSubmissionId: "client-12345678",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing submission ids to protect retries", () => {
    const result = quickPourSchema.safeParse({
      projectId: crypto.randomUUID(),
      pourDate: "2026-03-30",
      concreteAmount: 22.5,
      locationDescription: "South slab strip",
      clientSubmissionId: "",
    });

    expect(result.success).toBe(false);
  });
});
