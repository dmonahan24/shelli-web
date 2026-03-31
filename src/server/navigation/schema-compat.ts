import { dbClient } from "@/db";

export const HUMAN_FRIENDLY_URL_MIGRATION_FILE = "0006_human_friendly_hierarchy_urls.sql";

export const HUMAN_FRIENDLY_URL_REQUIRED_COLUMNS = [
  { tableName: "projects", columnName: "slug" },
  { tableName: "project_buildings", columnName: "slug" },
  { tableName: "building_floors", columnName: "slug" },
] as const;

type ExistingColumnRow = {
  table_name: string;
  column_name: string;
};

type RequiredHumanFriendlyUrlColumn = (typeof HUMAN_FRIENDLY_URL_REQUIRED_COLUMNS)[number];

let humanFriendlyUrlSchemaPromise: Promise<void> | null = null;

export function getMissingHumanFriendlyUrlColumns(
  existingColumns: ReadonlyArray<ExistingColumnRow>
) {
  const existingColumnKeys = new Set(
    existingColumns.map((column) => `${column.table_name}.${column.column_name}`)
  );

  return HUMAN_FRIENDLY_URL_REQUIRED_COLUMNS.filter(
    (column) => !existingColumnKeys.has(`${column.tableName}.${column.columnName}`)
  );
}

export function formatHumanFriendlyUrlSchemaError(
  missingColumns: ReadonlyArray<RequiredHumanFriendlyUrlColumn> = HUMAN_FRIENDLY_URL_REQUIRED_COLUMNS
) {
  const missingColumnList = missingColumns
    .map((column) => `${column.tableName}.${column.columnName}`)
    .join(", ");

  return [
    `Human-friendly project URLs require database migration ${HUMAN_FRIENDLY_URL_MIGRATION_FILE}.`,
    `Missing columns: ${missingColumnList}.`,
    "Run `bun run db:migrate` against this database, then reload the app.",
  ].join(" ");
}

async function queryExistingHumanFriendlyUrlColumns() {
  return dbClient<ExistingColumnRow[]>`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and (
        (table_name = 'projects' and column_name = 'slug')
        or (table_name = 'project_buildings' and column_name = 'slug')
        or (table_name = 'building_floors' and column_name = 'slug')
      )
  `;
}

export async function ensureHumanFriendlyUrlSchema() {
  if (!humanFriendlyUrlSchemaPromise) {
    humanFriendlyUrlSchemaPromise = (async () => {
      const existingColumns = await queryExistingHumanFriendlyUrlColumns();
      const missingColumns = getMissingHumanFriendlyUrlColumns(existingColumns);

      if (missingColumns.length > 0) {
        throw new Error(formatHumanFriendlyUrlSchemaError(missingColumns));
      }
    })().catch((error) => {
      humanFriendlyUrlSchemaPromise = null;
      throw error;
    });
  }

  return humanFriendlyUrlSchemaPromise;
}
