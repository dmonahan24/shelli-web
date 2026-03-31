import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { companyMemberships, projectMembers, projects } from "@/db/schema";
import { normalizeAppUserRole, type TenantUserPrincipal } from "@/lib/auth/principal";
import {
  hasProjectPermission,
  normalizeProjectPermissionForCompanyRole,
  type ProjectPermission,
} from "@/lib/auth/permissions";
import { getCompanyMembershipForUser } from "@/lib/auth/company-access";
import { requireTenantUser } from "@/lib/auth/session";
import { memoizeRequestPromise, measureRequestSpan } from "@/lib/server/request-context";

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
  return memoizeRequestPromise(
    `auth:project-access-context:${user.id}:${projectId}`,
    async () =>
      measureRequestSpan("auth.project_access_context", async () => {
        const assignmentSummary = db
          .select({
            projectId: projectMembers.projectId,
            memberCount: sql<number>`count(*)`.as("member_count"),
          })
          .from(projectMembers)
          .groupBy(projectMembers.projectId)
          .as("project_assignment_summary");

        const row = await db
          .select({
            projectId: projects.id,
            companyId: projects.companyId,
            projectName: projects.name,
            projectManagerUserId: projects.projectManagerUserId,
            superintendentUserId: projects.superintendentUserId,
            companyRole: companyMemberships.role,
            membershipStatus: companyMemberships.status,
            projectRole: projectMembers.role,
            explicitMemberCount: sql<number>`coalesce(${assignmentSummary.memberCount}, 0)`,
          })
          .from(projects)
          .innerJoin(
            companyMemberships,
            and(
              eq(companyMemberships.companyId, projects.companyId),
              eq(companyMemberships.userId, user.id)
            )
          )
          .leftJoin(
            projectMembers,
            and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, user.id))
          )
          .leftJoin(assignmentSummary, eq(assignmentSummary.projectId, projects.id))
          .where(eq(projects.id, projectId))
          .then((rows) => rows[0] ?? null);

        if (!row || row.membershipStatus !== "active") {
          return null;
        }

        const hasExplicitAssignments =
          Boolean(row.projectManagerUserId) ||
          Boolean(row.superintendentUserId) ||
          row.explicitMemberCount > 0;

        return {
          project: {
            id: row.projectId,
            companyId: row.companyId,
            name: row.projectName,
            projectManagerUserId: row.projectManagerUserId ?? null,
            superintendentUserId: row.superintendentUserId ?? null,
          },
          companyRole: normalizeAppUserRole(row.companyRole),
          projectRole: row.projectRole ?? null,
          hasExplicitAssignments,
        };
      })
  );
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
  return memoizeRequestPromise(
    `auth:accessible-project-ids:${user.id}:${companyId}`,
    async () =>
      measureRequestSpan(
        "auth.accessible_project_ids",
        async () => {
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

          const assignmentSummary = db
            .select({
              projectId: projectMembers.projectId,
              memberCount: sql<number>`count(*)`.as("member_count"),
            })
            .from(projectMembers)
            .groupBy(projectMembers.projectId)
            .as("project_assignment_summary");

          const rows = await db
            .select({
              id: projects.id,
            })
            .from(projects)
            .leftJoin(
              projectMembers,
              and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, user.id))
            )
            .leftJoin(assignmentSummary, eq(assignmentSummary.projectId, projects.id))
            .where(
              and(
                eq(projects.companyId, companyId),
                or(
                  and(
                    isNull(projects.projectManagerUserId),
                    isNull(projects.superintendentUserId),
                    sql`coalesce(${assignmentSummary.memberCount}, 0) = 0`
                  ),
                  eq(projects.projectManagerUserId, user.id),
                  eq(projects.superintendentUserId, user.id),
                  eq(projectMembers.userId, user.id)
                )
              )
            );

          return rows.map((row) => row.id);
        },
        {
          details: (projectIds) => ({
            count: projectIds.length,
          }),
        }
      )
  );
}
