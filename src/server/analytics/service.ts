import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityEvents, attachments, pours, projects } from "@/db/schema";
import { canViewAnalytics } from "@/lib/auth/company-access";
import { listAccessibleProjectIds, requireProjectAccess } from "@/lib/auth/project-access";
import { requireTenantUser } from "@/lib/auth/session";
import {
  companyAnalyticsQuerySchema,
  projectAnalyticsQuerySchema,
  type CompanyAnalyticsQueryInput,
  type ProjectAnalyticsQueryInput,
} from "@/lib/validation/analytics";
import { listRecentActivity } from "@/server/activity/service";
import { ensureHumanFriendlyUrlSchema } from "@/server/navigation/schema-compat";
import {
  buildDocumentationTasks,
  calculateAveragePourSize,
  calculateDaysSinceLastPour,
  calculatePercentComplete,
  calculateRemainingConcrete,
  getDocumentationCompletionSignal,
  getScheduleRiskIndicator,
  type BreakdownDatum,
  type ProjectRankingDatum,
  type TimeseriesPoint,
} from "@/server/analytics/calculations";

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  return value ? Number(value) : 0;
}

function groupSumByDate(rows: Array<{ date: string; value: number }>) {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.date, (map.get(row.date) ?? 0) + row.value);
  }

  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, value }));
}

function buildEstimatedCompletionDistribution(rows: Array<{ estimatedCompletionDate: string }>) {
  const now = new Date();
  const buckets = new Map<string, number>([
    ["Next 30 Days", 0],
    ["31-60 Days", 0],
    ["61-90 Days", 0],
    ["90+ Days", 0],
  ]);

  for (const row of rows) {
    const days = Math.ceil(
      (new Date(`${row.estimatedCompletionDate}T00:00:00`).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (days <= 30) {
      buckets.set("Next 30 Days", (buckets.get("Next 30 Days") ?? 0) + 1);
    } else if (days <= 60) {
      buckets.set("31-60 Days", (buckets.get("31-60 Days") ?? 0) + 1);
    } else if (days <= 90) {
      buckets.set("61-90 Days", (buckets.get("61-90 Days") ?? 0) + 1);
    } else {
      buckets.set("90+ Days", (buckets.get("90+ Days") ?? 0) + 1);
    }
  }

  return [...buckets.entries()].map(([label, value]) => ({ label, value }));
}

async function getScopedProjectIds(input: {
  companyId: string;
  assignedOnly?: boolean;
  userId: string;
  role: string;
}) {
  const user = await requireTenantUser();

  if (input.assignedOnly) {
    return listAccessibleProjectIds(user, input.companyId);
  }

  const broadAccess = await canViewAnalytics(user, input.companyId);
  if (broadAccess) {
    return db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.companyId, input.companyId))
      .then((rows) => rows.map((row) => row.id));
  }

  return listAccessibleProjectIds(user, input.companyId);
}

export async function getConcretePouredTimeseries(input: CompanyAnalyticsQueryInput) {
  const query = companyAnalyticsQuerySchema.parse(input);
  const user = await requireTenantUser();
  const companyId = query.companyId ?? user.companyId;
  const projectIds = await getScopedProjectIds({
    companyId,
    assignedOnly: query.assignedOnly,
    userId: user.id,
    role: user.role,
  });

  if (projectIds.length === 0) {
    return [] as TimeseriesPoint[];
  }

  const rows = await db
    .select({
      date: pours.scheduledDate,
      value: pours.actualVolume,
    })
    .from(pours)
    .where(
      and(
        eq(pours.companyId, companyId),
        inArray(pours.projectId, projectIds),
        gte(pours.scheduledDate, query.dateRange.from),
        lte(pours.scheduledDate, query.dateRange.to)
      )
    );

  return groupSumByDate(rows.map((row) => ({ date: row.date, value: toNumber(row.value) })));
}

export async function getProjectStatusBreakdown(input: CompanyAnalyticsQueryInput) {
  const query = companyAnalyticsQuerySchema.parse(input);
  const user = await requireTenantUser();
  const companyId = query.companyId ?? user.companyId;
  const projectIds = await getScopedProjectIds({
    companyId,
    assignedOnly: query.assignedOnly,
    userId: user.id,
    role: user.role,
  });

  if (projectIds.length === 0) {
    return [] as BreakdownDatum[];
  }

  const rows = await db
    .select({
      status: projects.status,
      count: sql<number>`count(*)`,
    })
    .from(projects)
    .where(and(eq(projects.companyId, companyId), inArray(projects.id, projectIds)))
    .groupBy(projects.status);

  return rows.map((row) => ({
    label: row.status.replaceAll("_", " "),
    value: row.count,
  }));
}

export async function getTopProjectsByConcrete(input: CompanyAnalyticsQueryInput) {
  const query = companyAnalyticsQuerySchema.parse(input);
  const user = await requireTenantUser();
  await ensureHumanFriendlyUrlSchema();
  const companyId = query.companyId ?? user.companyId;
  const projectIds = await getScopedProjectIds({
    companyId,
    assignedOnly: query.assignedOnly,
    userId: user.id,
    role: user.role,
  });

  if (projectIds.length === 0) {
    return [] as ProjectRankingDatum[];
  }

  const rows = await db
    .select({
      projectId: projects.id,
      projectSlug: projects.slug,
      projectName: projects.name,
      totalConcretePoured: projects.totalConcretePoured,
    })
    .from(projects)
    .where(and(eq(projects.companyId, companyId), inArray(projects.id, projectIds)))
    .orderBy(desc(projects.totalConcretePoured))
    .limit(5);

  return rows.map((row) => ({
    projectId: row.projectId,
    projectSlug: row.projectSlug,
    projectName: row.projectName,
    value: toNumber(row.totalConcretePoured),
  }));
}

export async function getRecentFieldActivity(input: CompanyAnalyticsQueryInput) {
  const query = companyAnalyticsQuerySchema.parse(input);
  const user = await requireTenantUser();
  const companyId = query.companyId ?? user.companyId;

  return listRecentActivity({
    companyId,
    limit: 8,
  });
}

export async function getCompanyAnalyticsOverview(rawInput: CompanyAnalyticsQueryInput) {
  const input = companyAnalyticsQuerySchema.parse(rawInput);
  const user = await requireTenantUser();
  await ensureHumanFriendlyUrlSchema();
  const companyId = input.companyId ?? user.companyId;
  const projectIds = await getScopedProjectIds({
    companyId,
    assignedOnly: input.assignedOnly,
    userId: user.id,
    role: user.role,
  });

  if (projectIds.length === 0) {
    return {
      kpis: {
        activeProjects: 0,
        completedProjects: 0,
        totalConcretePoured: 0,
        totalConcretePouredThisMonth: 0,
        averageProjectCompletionPercentage: 0,
        upcomingEstimatedCompletions: 0,
        openProjectsWithNoRecentPourActivity: 0,
        documentationCompletionRate: 100,
      },
      charts: {
        concretePouredOverTime: [] as TimeseriesPoint[],
        projectStartsOverTime: [] as TimeseriesPoint[],
        estimatedCompletionDistribution: [] as BreakdownDatum[],
        projectStatusBreakdown: [] as BreakdownDatum[],
        topProjectsByConcrete: [] as ProjectRankingDatum[],
      },
      recentFieldActivity: [],
    };
  }

  const [projectRows, pourRows, attachmentRows, recentFieldActivity] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        dateStarted: projects.dateStarted,
        estimatedCompletionDate: projects.estimatedCompletionDate,
        lastPourDate: projects.lastPourDate,
        totalConcretePoured: projects.totalConcretePoured,
        estimatedTotalConcrete: projects.estimatedTotalConcrete,
      })
      .from(projects)
      .where(
        and(
          eq(projects.companyId, companyId),
          inArray(projects.id, projectIds),
          input.status === "all" ? undefined : eq(projects.status, input.status)
        )
      ),
    db
      .select({
        projectId: pours.projectId,
        date: pours.scheduledDate,
        actualVolume: pours.actualVolume,
      })
      .from(pours)
      .where(
        and(
          eq(pours.companyId, companyId),
          inArray(pours.projectId, projectIds),
          gte(pours.scheduledDate, input.dateRange.from),
          lte(pours.scheduledDate, input.dateRange.to)
        )
      ),
    db
      .select({
        projectId: attachments.projectId,
        createdAt: sql<string>`to_char(${attachments.createdAt}, 'YYYY-MM-DD')`,
        attachmentType: attachments.attachmentType,
      })
      .from(attachments)
      .where(
        and(
          eq(attachments.companyId, companyId),
          inArray(attachments.projectId, projectIds),
          gte(sql`date(${attachments.createdAt})`, input.dateRange.from),
          lte(sql`date(${attachments.createdAt})`, input.dateRange.to)
        )
      ),
    getRecentFieldActivity(input),
  ]);

  const activeProjects = projectRows.filter((project) => project.status === "active");
  const completedProjects = projectRows.filter((project) => project.status === "completed");
  const totalConcretePoured = projectRows.reduce(
    (total, project) => total + toNumber(project.totalConcretePoured),
    0
  );
  const totalConcretePouredThisMonth = pourRows
    .filter((row) => row.date >= new Date().toISOString().slice(0, 7))
    .reduce((total, row) => total + toNumber(row.actualVolume), 0);
  const averageProjectCompletionPercentage =
    projectRows.length === 0
      ? 0
      : projectRows.reduce(
          (total, project) =>
            total +
            calculatePercentComplete(
              toNumber(project.totalConcretePoured),
              toNumber(project.estimatedTotalConcrete)
            ),
          0
        ) / projectRows.length;
  const upcomingEstimatedCompletions = activeProjects.filter((project) => {
    const date = new Date(`${project.estimatedCompletionDate}T00:00:00`);
    return date.getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 30;
  }).length;
  const openProjectsWithNoRecentPourActivity = activeProjects.filter((project) => {
    const daysSinceLastPour = calculateDaysSinceLastPour(project.lastPourDate);
    return daysSinceLastPour === null || daysSinceLastPour > 14;
  }).length;

  const attachmentCountByProjectId = new Map<string, number>();
  for (const row of attachmentRows) {
    attachmentCountByProjectId.set(row.projectId, (attachmentCountByProjectId.get(row.projectId) ?? 0) + 1);
  }

  const documentationCompletionRate =
    activeProjects.length === 0
      ? 100
      : (activeProjects.filter((project) => (attachmentCountByProjectId.get(project.id) ?? 0) > 0).length /
          activeProjects.length) *
        100;

  return {
    kpis: {
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalConcretePoured,
      totalConcretePouredThisMonth,
      averageProjectCompletionPercentage,
      upcomingEstimatedCompletions,
      openProjectsWithNoRecentPourActivity,
      documentationCompletionRate,
    },
    charts: {
      concretePouredOverTime: groupSumByDate(
        pourRows.map((row) => ({ date: row.date, value: toNumber(row.actualVolume) }))
      ),
      projectStartsOverTime: groupSumByDate(
        projectRows.map((row) => ({
          date: row.dateStarted,
          value: 1,
        }))
      ),
      estimatedCompletionDistribution: buildEstimatedCompletionDistribution(projectRows),
      projectStatusBreakdown: await getProjectStatusBreakdown(input),
      topProjectsByConcrete: await getTopProjectsByConcrete(input),
    },
    recentFieldActivity,
  };
}

export async function getProjectAnalytics(rawInput: ProjectAnalyticsQueryInput) {
  const input = projectAnalyticsQuerySchema.parse(rawInput);
  const access = await requireProjectAccess(input.projectId, "analytics");
  await ensureHumanFriendlyUrlSchema();
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, input.projectId),
  });

  if (!project) {
    return null;
  }

  const [pourRows, attachmentRows, activityRows] = await Promise.all([
    db
      .select({
        id: pours.id,
        date: pours.scheduledDate,
        actualVolume: pours.actualVolume,
        mixType: pours.mixDesignLabel,
      })
      .from(pours)
      .where(
        and(
          eq(pours.projectId, input.projectId),
          gte(pours.scheduledDate, input.dateRange.from),
          lte(pours.scheduledDate, input.dateRange.to)
        )
      )
      .orderBy(pours.scheduledDate),
    db
      .select({
        id: attachments.id,
        createdAt: sql<string>`to_char(${attachments.createdAt}, 'YYYY-MM-DD')`,
        attachmentType: attachments.attachmentType,
      })
      .from(attachments)
      .where(
        and(
          eq(attachments.projectId, input.projectId),
          gte(sql`date(${attachments.createdAt})`, input.dateRange.from),
          lte(sql`date(${attachments.createdAt})`, input.dateRange.to)
        )
      ),
    listRecentActivity({
      companyId: access.context.project.companyId,
      projectId: input.projectId,
      limit: 10,
    }),
  ]);

  const totalConcretePoured = toNumber(project.totalConcretePoured);
  const estimatedTotalConcrete = toNumber(project.estimatedTotalConcrete);
  const percentComplete = calculatePercentComplete(totalConcretePoured, estimatedTotalConcrete);
  const remainingConcrete = calculateRemainingConcrete(totalConcretePoured, estimatedTotalConcrete);
  const averagePourSize = calculateAveragePourSize(totalConcretePoured, pourRows.length);
  const daysSinceLastPour = calculateDaysSinceLastPour(project.lastPourDate);
  const documentationSignal = getDocumentationCompletionSignal({
    recentPourCount: pourRows.length,
    recentDocumentedPourCount: attachmentRows.length > 0 ? Math.min(attachmentRows.length, pourRows.length) : 0,
  });
  const scheduleRisk = getScheduleRiskIndicator({
    percentComplete,
    projectStartDate: project.dateStarted,
    estimatedCompletionDate: project.estimatedCompletionDate,
    lastPourDate: project.lastPourDate,
    status: project.status,
  });

  let runningTotal = 0;
  const cumulativeProgress = pourRows.map((row) => {
    runningTotal += toNumber(row.actualVolume);
    return {
      date: row.date,
      actual: runningTotal,
      estimated: estimatedTotalConcrete,
    };
  });

  const mixTypeCounts = new Map<string, number>();
  for (const row of pourRows) {
    const label = row.mixType ?? "Unspecified";
    mixTypeCounts.set(label, (mixTypeCounts.get(label) ?? 0) + toNumber(row.actualVolume));
  }

  return {
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      status: project.status,
      percentComplete,
      scheduleRisk,
      documentationSignal,
    },
    kpis: {
      totalConcretePoured,
      estimatedTotalConcrete,
      percentComplete,
      remainingConcrete,
      averagePourSize,
      lastPourDate: project.lastPourDate,
      daysSinceLastPour,
      totalAttachments: attachmentRows.length,
      totalDeliveryTickets: attachmentRows.filter((row) => row.attachmentType === "delivery_ticket").length,
      scheduleRiskIndicator: scheduleRisk,
    },
    charts: {
      cumulativeProgress,
      weeklyPours: groupSumByDate(
        pourRows.map((row) => ({
          date: row.date,
          value: toNumber(row.actualVolume),
        }))
      ),
      mixTypeDistribution: [...mixTypeCounts.entries()].map(([label, value]) => ({ label, value })),
      attachmentTimeline: groupSumByDate(
        attachmentRows.map((row) => ({
          date: row.createdAt,
          value: 1,
        }))
      ),
      plannedVsActualProgress: cumulativeProgress.map((point, index, all) => ({
        date: point.date,
        actual: point.actual,
        planned: (estimatedTotalConcrete / Math.max(all.length, 1)) * (index + 1),
      })),
    },
    recentActivity: activityRows,
    documentationTasks: buildDocumentationTasks({
      projectName: project.name,
      recentPourCount: pourRows.length,
      recentPhotoCount: attachmentRows.filter((row) => row.attachmentType === "photo").length,
      recentTicketCount: attachmentRows.filter((row) => row.attachmentType === "delivery_ticket").length,
    }),
  };
}
