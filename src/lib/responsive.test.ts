import { describe, expect, test } from "bun:test";
import { getActiveFilterCount, summarizeActiveFilters } from "@/lib/responsive";

describe("responsive helpers", () => {
  test("returns the fallback when no filters are active", () => {
    expect(summarizeActiveFilters([null, undefined, ""])).toBe("No active filters");
  });

  test("summarizes one and two active filters directly", () => {
    expect(summarizeActiveFilters(["Status: active"])).toBe("Status: active");
    expect(summarizeActiveFilters(["Status: active", "Sort: date"])).toBe(
      "Status: active and Sort: date"
    );
  });

  test("condenses longer filter lists", () => {
    expect(
      summarizeActiveFilters([
        "Status: active",
        "Sort: date",
        "Assigned: me",
        "Date: today",
      ])
    ).toBe("Status: active, Sort: date, +2 more");
  });

  test("counts only active filters", () => {
    expect(getActiveFilterCount(["Search", null, undefined, "", "Status"])).toBe(2);
  });
});
