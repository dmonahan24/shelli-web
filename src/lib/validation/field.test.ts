import { describe, expect, it } from "bun:test";
import {
  createFieldNoteSchema,
  listFieldNotesSchema,
  quickPourSchema,
} from "@/lib/validation/field";
import { truncateText } from "@/lib/utils/format";

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

  it("accepts a building id or no building, and rejects malformed building ids", () => {
    const base = {
      projectId: crypto.randomUUID(),
      pourDate: "2026-03-30",
      concreteAmount: 22.5,
      locationDescription: "South slab strip",
      clientSubmissionId: "client-12345678",
    };

    expect(quickPourSchema.safeParse({ ...base, buildingId: crypto.randomUUID() }).success).toBe(true);
    expect(quickPourSchema.safeParse({ ...base, buildingId: "" }).success).toBe(true);
    expect(quickPourSchema.safeParse({ ...base, buildingId: "BLDG-A" }).success).toBe(false);
  });
});

describe("field note validation", () => {
  const projectId = "5f1c7a0e-8b4d-4a53-9c1e-2d7f3b6a9e10";

  it("trims the note before saving", () => {
    const result = createFieldNoteSchema.parse({
      projectId,
      note: "  Pump truck arrived late.  ",
    });

    expect(result.note).toBe("Pump truck arrived late.");
  });

  it("rejects an empty or whitespace-only note", () => {
    for (const note of ["", "   ", "\n\t"]) {
      expect(createFieldNoteSchema.safeParse({ projectId, note }).success).toBe(false);
    }
  });

  it("enforces the 2000 character note limit", () => {
    expect(createFieldNoteSchema.safeParse({ projectId, note: "x".repeat(2000) }).success).toBe(
      true
    );
    expect(createFieldNoteSchema.safeParse({ projectId, note: "x".repeat(2001) }).success).toBe(
      false
    );
  });

  it("rejects a note without a valid project id", () => {
    expect(createFieldNoteSchema.safeParse({ projectId: "nope", note: "hi" }).success).toBe(false);
  });

  it("defaults and clamps the note list limit", () => {
    expect(listFieldNotesSchema.parse({ projectId }).limit).toBe(20);
    expect(listFieldNotesSchema.parse({ projectId, limit: 500 }).limit).toBe(20);
    expect(listFieldNotesSchema.parse({ projectId, limit: 5 }).limit).toBe(5);
  });
});

describe("truncateText", () => {
  it("leaves short text untouched", () => {
    expect(truncateText("Short note", 80)).toBe("Short note");
  });

  it("collapses newlines and repeated spaces onto one line", () => {
    expect(truncateText("line one\n\nline  two", 80)).toBe("line one line two");
  });

  it("clips long text to the limit including the ellipsis", () => {
    const result = truncateText("x".repeat(200), 80);

    expect(result.length).toBe(80);
    expect(result.endsWith("…")).toBe(true);
  });
});
