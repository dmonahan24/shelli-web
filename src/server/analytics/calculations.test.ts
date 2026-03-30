import { describe, expect, it } from "bun:test";
import {
  buildDocumentationTasks,
  calculatePercentComplete,
  calculateRemainingConcrete,
  getDocumentationCompletionSignal,
  getScheduleRiskIndicator,
} from "@/server/analytics/calculations";

describe("analytics calculations", () => {
  it("computes percent complete and remaining concrete", () => {
    expect(calculatePercentComplete(50, 200)).toBe(25);
    expect(calculateRemainingConcrete(50, 200)).toBe(150);
    expect(calculatePercentComplete(400, 200)).toBe(100);
  });

  it("derives documentation completion signals", () => {
    expect(getDocumentationCompletionSignal({ recentPourCount: 3, recentDocumentedPourCount: 3 })).toBe("green");
    expect(getDocumentationCompletionSignal({ recentPourCount: 3, recentDocumentedPourCount: 1 })).toBe("yellow");
    expect(getDocumentationCompletionSignal({ recentPourCount: 3, recentDocumentedPourCount: 0 })).toBe("red");
  });

  it("marks schedule risk when progress trails the timeline", () => {
    const risk = getScheduleRiskIndicator({
      percentComplete: 10,
      projectStartDate: "2026-01-01",
      estimatedCompletionDate: "2026-04-05",
      lastPourDate: "2026-02-01",
      status: "active",
      today: new Date("2026-03-30T12:00:00Z"),
    });

    expect(["medium", "high"]).toContain(risk);
  });

  it("surfaces documentation reminder tasks", () => {
    const tasks = buildDocumentationTasks({
      projectName: "North Tower",
      recentPourCount: 2,
      recentPhotoCount: 0,
      recentTicketCount: 1,
    });

    expect(tasks.length).toBe(2);
  });
});
