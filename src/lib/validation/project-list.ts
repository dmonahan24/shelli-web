import { z } from "zod";
import { routeIdentifierSchema } from "@/lib/slug";
import { projectStatusSchema } from "@/lib/validation/project";

export const projectSortByValues = [
  "dateStarted",
  "estimatedCompletionDate",
  "name",
  "totalConcretePoured",
  "estimatedTotalConcrete",
  "updatedAt",
] as const;

export const projectSortBySchema = z.enum(projectSortByValues);
export const sortDirectionSchema = z.enum(["asc", "desc"]);
export const projectProgressValues = [
  "all",
  "not_started",
  "in_progress",
  "complete",
] as const;
export const projectProgressSchema = z.enum(projectProgressValues);

export const projectListQuerySchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  status: z.union([projectStatusSchema, z.literal("all")]).catch("all").default("all"),
  progress: projectProgressSchema.catch("all").default("all"),
  sortBy: projectSortBySchema.catch("updatedAt").default("updatedAt"),
  sortDir: sortDirectionSchema.catch("desc").default("desc"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(10).default(10),
  startDateFrom: z.string().optional().catch(undefined),
  startDateTo: z.string().optional().catch(undefined),
  estimatedDateFrom: z.string().optional().catch(undefined),
  estimatedDateTo: z.string().optional().catch(undefined),
});

export const projectDetailParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export const projectRouteParamsSchema = z.object({
  projectIdentifier: routeIdentifierSchema,
});

export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
