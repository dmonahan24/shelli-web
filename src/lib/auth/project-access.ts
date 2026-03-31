import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { projectMembers, projects } from "@/db/schema";
import { normalizeAppUserRole, type TenantUserPrincipal } from "@/lib/auth/principal";
import {
  hasProjectPermission,
  normalizeProjectPermissionForCompanyRole,
  type ProjectPermission,
} from "@/lib/auth/permissions";
import { getCompanyMembershipForUser } from "@/lib/auth/company-access";
import { requireTenantUser } from "@/lib/auth/session";

export type ProjectAccessLevel = ProjectPermission;

export type ProjectAccessContext = {
  project: {
    id: string;
    companyId: string;
    name: string;
    projectManagerUserId: string | null;
    superintendentUserId: string | null;
  };
  companyRole: TenantUserPrincipal["role"];
  projectRole: "project_admin" | "editor" | "contributor" | "viewer" | null;
  hasExplicitAssignments: boolean;
};

async function getProjectAccessContextForUser(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  projectId: string
): Promise<ProjectAccessContext | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return null;
  }

  const membership = await getCompanyMembershipForUser(user.id, project.companyId);
  if (!membership || membership.status !== "active") {
    return null;
  }

  const [projectMember, projectMemberCountRow] = await Promise.all([
    db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId)),
  ]);

  const hasExplicitAssignments =
    Boolean(project.projectManagerUserId) ||
    Boolean(project.superintendentUserId) ||
    (projectMemberCountRow[0]?.count ?? 0) > 0;

  return {
    project: {
      id: project.id,
      companyId: project.companyId,
      name: project.name,
      projectManagerUserId: project.projectManagerUserId ?? null,
      superintendentUserId: project.superintendentUserId ?? null,
    },
    companyRole: normalizeAppUserRole(membership.role),
    projectRole: projectMember?.role ?? null,
    hasExplicitAssignments,
  };
}

function userIsAssignedToProject(
  userId: string,
  context: ProjectAccessContext
) {
  if (!context.hasExplicitAssignments) {
    return true;
  }

  return (
    context.projectRole !== null ||
    context.project.projectManagerUserId === userId ||
    context.project.superintendentUserId === userId
  );
}

export function hasProjectAccess(
  user: Pick<TenantUserPrincipal, "id">,
  context: ProjectAccessContext,
  accessLevel: ProjectAccessLevel
) {
  if (normalizeProjectPermissionForCompanyRole(context.companyRole, accessLevel)) {
    const normalizedCompanyRole = normalizeAppUserRole(context.companyRole);

    if (
      normalizedCompanyRole === "project_manager" ||
      normalizedCompanyRole === "field_supervisor" ||
      normalizedCompanyRole === "viewer"
    ) {
      return userIsAssignedToProject(user.id, context);
    }

    return true;
  }

  if (!userIsAssignedToProject(user.id, context) || !context.projectRole) {
    return false;
  }

  return hasProjectPermission(context.projectRole, accessLevel);
}

export async function requireProjectAccess(
  projectId: string,
  accessLevel: ProjectAccessLevel
) {
  const user = await requireTenantUser();
  const context = await getProjectAccessContextForUser(user, projectId);

  if (!context || !hasProjectAccess(user, context, accessLevel)) {
    throw new Error("Project access required.");
  }

  return {
    user,
    context,
  };
}

export async function canEditProject(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  projectId: string
) {
  const context = await getProjectAccessContextForUser(user, projectId);
  return Boolean(context && hasProjectAccess(user, context, "edit"));
}

export async function canDeleteProject(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  projectId: string
) {
  const context = await getProjectAccessContextForUser(user, projectId);
  return Boolean(context && hasProjectAccess(user, context, "delete"));
}

export async function listAccessibleProjectIds(
  user: Pick<TenantUserPrincipal, "id" | "companyId" | "role">,
  companyId: string
) {
  const membership = await getCompanyMembershipForUser(user.id, companyId);
  if (!membership || membership.status !== "active") {
    return [];
  }

  const normalizedRole = normalizeAppUserRole(membership.role);

  if (normalizedRole === "owner" || normalizedRole === "admin") {
    return db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.companyId, companyId))
      .then((rows) => rows.map((row) => row.id));
  }

  const projectRows = await db
    .select({
      id: projects.id,
      projectManagerUserId: projects.projectManagerUserId,
      superintendentUserId: projects.superintendentUserId,
    })
    .from(projects)
    .where(eq(projects.companyId, companyId));

  if (projectRows.length === 0) {
    return [];
  }

  const memberRows = await db
    .select({
      projectId: projectMembers.projectId,
    })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.userId, user.id), inArray(projectMembers.projectId, projectRows.map((row) => row.id)))
    );

  const memberProjectIds = new Set(memberRows.map((row) => row.projectId));
  const explicitlyAssignedCount = await db
    .select({
      projectId: projectMembers.projectId,
      count: sql<number>`count(*)`,
    })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, projectRows.map((row) => row.id)))
    .groupBy(projectMembers.projectId);
  const explicitAssignmentMap = new Map(explicitlyAssignedCount.map((row) => [row.projectId, row.count]));

  return projectRows
    .filter((project) => {
      const hasExplicitAssignments =
        Boolean(project.projectManagerUserId) ||
        Boolean(project.superintendentUserId) ||
        (explicitAssignmentMap.get(project.id) ?? 0) > 0;

      if (!hasExplicitAssignments) {
        return true;
      }

      return (
        project.projectManagerUserId === user.id ||
        project.superintendentUserId === user.id ||
        memberProjectIds.has(project.id)
      );
    })
    .map((project) => project.id);
}
