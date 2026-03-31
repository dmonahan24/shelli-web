import type { TenantUserPrincipal } from "@/lib/auth/principal";
import { requireTenantUser } from "@/lib/auth/session";
import { measureRequestSpan } from "@/lib/server/request-context";
import { getCompanyAnalyticsOverview } from "@/server/analytics/service";
import {
  getFieldHomeCriticalData,
  getFieldHomeDeferredData,
} from "@/server/field/service";
import { listProjectsForUser } from "@/server/projects/service";

function defaultDashboardDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 90);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function canViewDashboardAnalytics(user: Pick<TenantUserPrincipal, "role">) {
  return user.role !== "field_supervisor" && user.role !== "viewer";
}

export async function getDashboardHomeCriticalData(
  user?: Pick<TenantUserPrincipal, "id" | "companyId" | "role">
) {
  const resolvedUser = user ?? (await requireTenantUser());

  return measureRequestSpan(
    "dashboard.home_critical",
    async () => ({
      fieldHome:
        resolvedUser.role === "field_supervisor"
          ? await getFieldHomeCriticalData(resolvedUser)
          : null,
      projects:
        resolvedUser.role === "field_supervisor"
          ? null
          : await listProjectsForUser(resolvedUser, {
              page: 1,
              pageSize: 5,
            }),
    }),
    {
      details: (result) => ({
        hasFieldHome: Boolean(result.fieldHome),
        hasProjects: Boolean(result.projects),
      }),
    }
  );
}

export async function getDashboardHomeDeferredData() {
  const user = await requireTenantUser();

  return measureRequestSpan(
    "dashboard.home_deferred",
    async () => ({
      analytics: canViewDashboardAnalytics(user)
        ? await getCompanyAnalyticsOverview({
            dateRange: defaultDashboardDateRange(),
            status: "all",
            assignedOnly: user.role === "project_manager",
          })
        : null,
      fieldHome: await getFieldHomeDeferredData(user),
    }),
    {
      details: (result) => ({
        analytics: Boolean(result.analytics),
        recentActivity: result.fieldHome.recentActivity.length,
      }),
    }
  );
}
