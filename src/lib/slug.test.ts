import { describe, expect, it } from "bun:test";
import {
  buildProjectAttachmentFilePath,
  getBuildingRouteParams,
  getFloorRouteParams,
  getProjectIdentifier,
} from "@/lib/project-paths";
import { generateScopedSlug, isUuid, routeIdentifierSchema, slugifyName } from "@/lib/slug";

describe("slug helpers", () => {
  it("normalizes names into stable kebab-case slugs", () => {
    expect(slugifyName("  North Tower - Level 03  ")).toBe("north-tower-level-03");
    expect(slugifyName("###")).toBe("item");
  });

  it("appends numeric suffixes for scoped collisions", async () => {
    const existing = new Set(["north-tower", "north-tower-2"]);

    const slug = await generateScopedSlug("North Tower", async (candidate) =>
      existing.has(candidate)
    );

    expect(slug).toBe("north-tower-3");
  });

  it("truncates long collision candidates without losing the numeric suffix", async () => {
    const baseName = "A".repeat(80);
    const slug = await generateScopedSlug(baseName, async (candidate) => candidate === "a".repeat(64));

    expect(slug.endsWith("-2")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(64);
  });

  it("accepts slug and uuid route identifiers", () => {
    expect(routeIdentifierSchema.parse("north-tower")).toBe("north-tower");
    expect(
      routeIdentifierSchema.parse("550e8400-e29b-41d4-a716-446655440000")
    ).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("north-tower")).toBe(false);
  });

  it("prefers slugs when building route params and attachment paths", () => {
    const project = { id: "project-uuid", slug: "bedrock-build" };
    const building = { id: "building-uuid", slug: "north-tower" };
    const floor = { id: "floor-uuid", slug: "level-3" };

    expect(getProjectIdentifier(project)).toBe("bedrock-build");
    expect(getBuildingRouteParams(project, building)).toEqual({
      buildingIdentifier: "north-tower",
      projectIdentifier: "bedrock-build",
    });
    expect(getFloorRouteParams(project, building, floor)).toEqual({
      buildingIdentifier: "north-tower",
      floorIdentifier: "level-3",
      projectIdentifier: "bedrock-build",
    });
    expect(buildProjectAttachmentFilePath(project, "attachment-1")).toBe(
      "/api/projects/bedrock-build/attachments/attachment-1/file"
    );
  });

  it("falls back to ids when slugs are unavailable", () => {
    const project = { id: "project-uuid", slug: "   " };
    const building = { id: "building-uuid" };
    const floor = { id: "floor-uuid", slug: null };

    expect(getProjectIdentifier(project)).toBe("project-uuid");
    expect(getBuildingRouteParams(project, building)).toEqual({
      buildingIdentifier: "building-uuid",
      projectIdentifier: "project-uuid",
    });
    expect(getFloorRouteParams(project, building, floor)).toEqual({
      buildingIdentifier: "building-uuid",
      floorIdentifier: "floor-uuid",
      projectIdentifier: "project-uuid",
    });
  });
});
