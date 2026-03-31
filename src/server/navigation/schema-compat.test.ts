import { describe, expect, it } from "bun:test";
import {
  HUMAN_FRIENDLY_URL_MIGRATION_FILE,
  formatHumanFriendlyUrlSchemaError,
  getMissingHumanFriendlyUrlColumns,
} from "@/server/navigation/schema-compat";

describe("human-friendly url schema compatibility", () => {
  it("reports any missing slug columns required by the url rollout", () => {
    const missingColumns = getMissingHumanFriendlyUrlColumns([
      { table_name: "projects", column_name: "slug" },
    ]);

    expect(missingColumns).toEqual([
      { tableName: "project_buildings", columnName: "slug" },
      { tableName: "building_floors", columnName: "slug" },
    ]);
  });

  it("formats a migration-focused error message", () => {
    const message = formatHumanFriendlyUrlSchemaError([
      { tableName: "projects", columnName: "slug" },
    ]);

    expect(message).toContain(HUMAN_FRIENDLY_URL_MIGRATION_FILE);
    expect(message).toContain("projects.slug");
    expect(message).toContain("bun run db:migrate");
  });
});
