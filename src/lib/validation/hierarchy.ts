import { z } from "zod";
import {
  floorTypeValues,
  pourCategoryValues,
  pourTypeStatusValues,
} from "@/lib/hierarchy";
import { routeIdentifierSchema } from "@/lib/slug";

export const hierarchyProjectParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export const hierarchyProjectRouteParamsSchema = z.object({
  projectIdentifier: routeIdentifierSchema,
});

export const hierarchyBuildingParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  buildingId: z.string().uuid("Invalid building id"),
});

export const hierarchyBuildingRouteParamsSchema = z.object({
  projectIdentifier: routeIdentifierSchema,
  buildingIdentifier: routeIdentifierSchema,
});

export const hierarchyFloorParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  buildingId: z.string().uuid("Invalid building id"),
  floorId: z.string().uuid("Invalid floor id"),
});

export const hierarchyFloorRouteParamsSchema = z.object({
  projectIdentifier: routeIdentifierSchema,
  buildingIdentifier: routeIdentifierSchema,
  floorIdentifier: routeIdentifierSchema,
});

export const hierarchySortDirectionSchema = z.enum(["asc", "desc"]);

export const hierarchyBuildingsSearchSchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  sortBy: z
    .enum(["displayOrder", "name", "estimatedConcreteTotal", "actualConcreteTotal", "floorCount"])
    .catch("displayOrder")
    .default("displayOrder"),
  sortDir: hierarchySortDirectionSchema.catch("asc").default("asc"),
});

export const hierarchyFloorsSearchSchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  floorType: z.union([z.enum(floorTypeValues), z.literal("all")]).catch("all").default("all"),
  sortBy: z
    .enum(["displayOrder", "name", "levelNumber", "estimatedConcreteTotal", "actualConcreteTotal"])
    .catch("displayOrder")
    .default("displayOrder"),
  sortDir: hierarchySortDirectionSchema.catch("asc").default("asc"),
});

export const hierarchyPourTypesSearchSchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  category: z.union([z.enum(pourCategoryValues), z.literal("all")]).catch("all").default("all"),
  status: z.union([z.enum(pourTypeStatusValues), z.literal("all")]).catch("all").default("all"),
  sortBy: z
    .enum(["displayOrder", "name", "estimatedConcrete", "actualConcrete", "updatedAt"])
    .catch("displayOrder")
    .default("displayOrder"),
  sortDir: hierarchySortDirectionSchema.catch("asc").default("asc"),
});
