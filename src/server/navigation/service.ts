import { and, eq } from "drizzle-orm";
import { db, type AppDatabase, type AppTransaction } from "@/db";
import { buildingFloors, projectBuildings, projects } from "@/db/schema";
import { generateScopedSlug, isUuid } from "@/lib/slug";
import { requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";

type ProjectPermission = "view" | "edit" | "upload" | "manage" | "delete";

async function findProjectForCompany(companyId: string, projectIdentifier: string) {
  return db.query.projects.findFirst({
    where: isUuid(projectIdentifier)
      ? and(eq(projects.id, projectIdentifier), eq(projects.companyId, companyId))
      : and(eq(projects.slug, projectIdentifier), eq(projects.companyId, companyId)),
  });
}

async function findBuildingForProject(
  projectId: string,
  companyId: string,
  buildingIdentifier: string
) {
  return db.query.projectBuildings.findFirst({
    where: isUuid(buildingIdentifier)
      ? and(
          eq(projectBuildings.id, buildingIdentifier),
          eq(projectBuildings.projectId, projectId),
          eq(projectBuildings.companyId, companyId)
        )
      : and(
          eq(projectBuildings.slug, buildingIdentifier),
          eq(projectBuildings.projectId, projectId),
          eq(projectBuildings.companyId, companyId)
        ),
  });
}

async function findFloorForBuilding(
  buildingId: string,
  projectId: string,
  companyId: string,
  floorIdentifier: string
) {
  return db.query.buildingFloors.findFirst({
    where: isUuid(floorIdentifier)
      ? and(
          eq(buildingFloors.id, floorIdentifier),
          eq(buildingFloors.buildingId, buildingId),
          eq(buildingFloors.projectId, projectId),
          eq(buildingFloors.companyId, companyId)
        )
      : and(
          eq(buildingFloors.slug, floorIdentifier),
          eq(buildingFloors.buildingId, buildingId),
          eq(buildingFloors.projectId, projectId),
          eq(buildingFloors.companyId, companyId)
        ),
  });
}

export async function resolveProjectRoute(projectIdentifier: string, permission: ProjectPermission) {
  const user = await requireTenantUser();
  const project = await findProjectForCompany(user.companyId, projectIdentifier);

  if (!project) {
    return null;
  }

  const access = await requireProjectAccess(project.id, permission);

  return {
    access,
    canonicalParams: {
      projectIdentifier: project.slug,
    },
    isCanonical: projectIdentifier === project.slug,
    project,
  };
}

export async function resolveBuildingRoute(
  input: {
    projectIdentifier: string;
    buildingIdentifier: string;
  },
  permission: ProjectPermission
) {
  const projectRoute = await resolveProjectRoute(input.projectIdentifier, permission);

  if (!projectRoute) {
    return null;
  }

  const building = await findBuildingForProject(
    projectRoute.project.id,
    projectRoute.project.companyId,
    input.buildingIdentifier
  );

  if (!building) {
    return null;
  }

  return {
    ...projectRoute,
    building,
    canonicalParams: {
      ...projectRoute.canonicalParams,
      buildingIdentifier: building.slug,
    },
    isCanonical:
      projectRoute.isCanonical && input.buildingIdentifier === building.slug,
  };
}

export async function resolveFloorRoute(
  input: {
    projectIdentifier: string;
    buildingIdentifier: string;
    floorIdentifier: string;
  },
  permission: ProjectPermission
) {
  const buildingRoute = await resolveBuildingRoute(
    {
      buildingIdentifier: input.buildingIdentifier,
      projectIdentifier: input.projectIdentifier,
    },
    permission
  );

  if (!buildingRoute) {
    return null;
  }

  const floor = await findFloorForBuilding(
    buildingRoute.building.id,
    buildingRoute.project.id,
    buildingRoute.project.companyId,
    input.floorIdentifier
  );

  if (!floor) {
    return null;
  }

  return {
    ...buildingRoute,
    canonicalParams: {
      ...buildingRoute.canonicalParams,
      floorIdentifier: floor.slug,
    },
    floor,
    isCanonical:
      buildingRoute.isCanonical && input.floorIdentifier === floor.slug,
  };
}

async function slugExistsForProject(
  companyId: string,
  slug: string,
  excludeProjectId?: string,
  database: AppDatabase | AppTransaction = db
) {
  const [existing] = await database
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.companyId, companyId), eq(projects.slug, slug)))
    .limit(1);

  return Boolean(existing && existing.id !== excludeProjectId);
}

async function slugExistsForBuilding(
  projectId: string,
  slug: string,
  excludeBuildingId?: string,
  database: AppDatabase | AppTransaction = db
) {
  const [existing] = await database
    .select({ id: projectBuildings.id })
    .from(projectBuildings)
    .where(and(eq(projectBuildings.projectId, projectId), eq(projectBuildings.slug, slug)))
    .limit(1);

  return Boolean(existing && existing.id !== excludeBuildingId);
}

async function slugExistsForFloor(
  buildingId: string,
  slug: string,
  excludeFloorId?: string,
  database: AppDatabase | AppTransaction = db
) {
  const [existing] = await database
    .select({ id: buildingFloors.id })
    .from(buildingFloors)
    .where(and(eq(buildingFloors.buildingId, buildingId), eq(buildingFloors.slug, slug)))
    .limit(1);

  return Boolean(existing && existing.id !== excludeFloorId);
}

export async function generateProjectSlug(
  companyId: string,
  name: string,
  excludeProjectId?: string,
  database: AppDatabase | AppTransaction = db
) {
  return generateScopedSlug(name, (slug) =>
    slugExistsForProject(companyId, slug, excludeProjectId, database)
  );
}

export async function generateBuildingSlug(
  projectId: string,
  name: string,
  excludeBuildingId?: string,
  database: AppDatabase | AppTransaction = db
) {
  return generateScopedSlug(name, (slug) =>
    slugExistsForBuilding(projectId, slug, excludeBuildingId, database)
  );
}

export async function generateFloorSlug(
  buildingId: string,
  name: string,
  excludeFloorId?: string,
  database: AppDatabase | AppTransaction = db
) {
  return generateScopedSlug(name, (slug) =>
    slugExistsForFloor(buildingId, slug, excludeFloorId, database)
  );
}
