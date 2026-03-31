import { describe, expect, it } from "bun:test";
import {
  getDefaultFloorDisplayOrder,
  getDefaultFloorName,
  getRemainingConcrete,
} from "@/lib/hierarchy";

describe("hierarchy helpers", () => {
  it("derives default floor names for required floor types", () => {
    expect(getDefaultFloorName("foundation")).toBe("Foundation");
    expect(getDefaultFloorName("ground")).toBe("Ground Level");
    expect(getDefaultFloorName("standard", 4)).toBe("Level 4");
  });

  it("prefers a custom floor name when provided", () => {
    expect(getDefaultFloorName("standard", 3, "Podium Transfer")).toBe("Podium Transfer");
  });

  it("uses stable display-order defaults for required floor levels", () => {
    expect(getDefaultFloorDisplayOrder("foundation")).toBeLessThan(
      getDefaultFloorDisplayOrder("ground")
    );
    expect(getDefaultFloorDisplayOrder("ground")).toBeLessThan(
      getDefaultFloorDisplayOrder("standard", 2)
    );
    expect(getDefaultFloorDisplayOrder("standard", 2)).toBeLessThan(
      getDefaultFloorDisplayOrder("standard", 3)
    );
  });

  it("never returns negative remaining concrete", () => {
    expect(getRemainingConcrete(100, 30)).toBe(70);
    expect(getRemainingConcrete(100, 120)).toBe(0);
  });
});
