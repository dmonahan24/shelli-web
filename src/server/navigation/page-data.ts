import { performance } from "node:perf_hooks";
import { createServerFn } from "@tanstack/start-client-core";
import { z } from "zod";
import { projectRouteParamsSchema } from "@/lib/validation/project-list";
import {
  hierarchyBuildingRouteParamsSchema,
  hierarchyFloorRouteParamsSchema,
} from "@/lib/validation/hierarchy";
import { env } from "@/lib/env/server";
import { runWithRequestContext } from "@/lib/server/request-context";
import { listProjectAttachmentsQuery } from "@/server/attachments/service";
import { getBuildingDetailQuery, listBuildingsForProjectQuery } from "@/server/buildings/service";
import { getProjectAccessRosterQuery } from "@/server/company/service";
import { listRecentActivity } from "@/server/activity/service";
import { resolveBuildingRoute, resolveFloorRoute, resolveProjectRoute } from "@/server/navigation/service";
import { listProjectPoursQuery } from "@/server/pours/service";
import { getProjectDetailQuery, summarizeActivity } from "@/server/projects/service";
import { getFloorDetailQuery } from "@/server/floors/service";

const loaderCauseSchema = z.enum(["preload", "enter", "stay"]).optional().default("enter");

type PageDataResult<TData, TParams> =
  | {
      status: "not_found";
    }
  | {
      status: "redirect";
      canonicalParams: TParams;
    }
  | {
      status: "success";
      data: TData;
    };

function logPageDataDuration(
  routeId: string,
  cause: string,
  startedAt: number,
  outcome: "not_found" | "redirect" | "success"
) {
  if (env.NODE_ENV === "production") {
    return;
  }

  const durationMs = Math.round(performance.now() - startedAt);
}

const projectPageDataInputSchema = z.object({
  cause: loaderCauseSchema,
  params: projectRouteParamsSchema,
});

const buildingPageDataInputSchema = z.object({
  cause: loaderCauseSchema,
  params: hierarchyBuildingRouteParamsSchema,
});

const floorPageDataInputSchema = z.object({
  cause: loaderCauseSchema,
  params: hierarchyFloorRouteParamsSchema,
});

export const getProjectPageDataServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => projectPageDataInputSchema.parse(input ?? {}))
  .handler(async ({ data }) =>
    (await runWithRequestContext("serverfn:project.page_critical", async () => {
      const startedAt = performance.now();
      const resolved = await resolveProjectRoute(data.params.projectIdentifier, "view");

      if (!resolved) {
        logPageDataDuration(
          "/dashboard/projects/$projectIdentifier",
          data.cause,
          startedAt,
          "not_found"
        );
        return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
      }

      if (!resolved.isCanonical) {
        logPageDataDuration("/dashboard/projects/$projectIdentifier", data.cause, startedAt, "redirect");
        return {
          status: "redirect",
          canonicalParams: resolved.canonicalParams,
        } satisfies PageDataResult<never, typeof data.params>;
      }

      const [detail, pours, buildings] = await Promise.all([
        getProjectDetailQuery(resolved.project.id, resolved.project.companyId),
        listProjectPoursQuery(resolved.project.id, {
          page: 1,
          pageSize: 10,
        }, resolved.project.companyId),
        listBuildingsForProjectQuery(resolved.project.id),
      ]);

      if (!detail) {
        logPageDataDuration(
          "/dashboard/projects/$projectIdentifier",
          data.cause,
          startedAt,
          "not_found"
        );
        return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
      }

      logPageDataDuration("/dashboard/projects/$projectIdentifier", data.cause, startedAt, "success");
      return {
        status: "success",
        data: {
          buildings,
          detail,
          pours,
        },
      } satisfies PageDataResult<
        {
          buildings: Awaited<ReturnType<typeof listBuildingsForProjectQuery>>;
          detail: Awaited<ReturnType<typeof getProjectDetailQuery>>;
          pours: Awaited<ReturnType<typeof listProjectPoursQuery>>;
        },
        typeof data.params
      >;
    })) as any
  );

export const getProjectPageDeferredDataServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => projectPageDataInputSchema.parse(input ?? {}))
  .handler(async ({ data }) =>
    (await runWithRequestContext("serverfn:project.page_deferred", async () => {
      const startedAt = performance.now();
      const resolved = await resolveProjectRoute(data.params.projectIdentifier, "view");

      if (!resolved) {
        logPageDataDuration(
          "/dashboard/projects/$projectIdentifier/deferred",
          data.cause,
          startedAt,
          "not_found"
        );
        return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
      }

      if (!resolved.isCanonical) {
        logPageDataDuration(
          "/dashboard/projects/$projectIdentifier/deferred",
          data.cause,
          startedAt,
          "redirect"
        );
        return {
          status: "redirect",
          canonicalParams: resolved.canonicalParams,
        } satisfies PageDataResult<never, typeof data.params>;
      }

      const [attachments, accessRoster, recentActivity] = await Promise.all([
        listProjectAttachmentsQuery(resolved.project.id, {
          page: 1,
          pageSize: 8,
        }, resolved.project.companyId),
        getProjectAccessRosterQuery({
          hasExplicitAssignments: resolved.access.context.hasExplicitAssignments,
          project: {
            id: resolved.project.id,
            name: resolved.project.name,
            companyId: resolved.project.companyId,
            projectManagerUserId: resolved.project.projectManagerUserId ?? null,
            superintendentUserId: resolved.project.superintendentUserId ?? null,
          },
        }),
        listRecentActivity({
          companyId: resolved.project.companyId,
          projectId: resolved.project.id,
          limit: 6,
        }),
      ]);

      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/deferred",
        data.cause,
        startedAt,
        "success"
      );

      return {
        status: "success",
        data: {
          attachments,
          accessRoster,
          recentActivity: recentActivity.map((activity) => ({
            ...activity,
            summary: summarizeActivity(activity.summary, activity.eventType, activity.metadataJson),
          })),
        },
      } satisfies PageDataResult<
        {
          attachments: Awaited<ReturnType<typeof listProjectAttachmentsQuery>>;
          accessRoster: Awaited<ReturnType<typeof getProjectAccessRosterQuery>>;
          recentActivity: Array<{
            actorName: string;
            createdAt: Date;
            entityId: string | null;
            entityType: string;
            eventType: string;
            id: string;
            metadataJson: unknown;
            projectId: string | null;
            summary: string;
          }>;
        },
        typeof data.params
      >;
    })) as any
  );

export const getProjectBuildingsPageDataServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => projectPageDataInputSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    const resolved = await resolveProjectRoute(data.params.projectIdentifier, "view");

    if (!resolved) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings",
        data.cause,
        startedAt,
        "not_found"
      );
      return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
    }

    if (!resolved.isCanonical) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings",
        data.cause,
        startedAt,
        "redirect"
      );
      return {
        status: "redirect",
        canonicalParams: resolved.canonicalParams,
      } satisfies PageDataResult<never, typeof data.params>;
    }

    const buildings = await listBuildingsForProjectQuery(resolved.project.id);
    logPageDataDuration(
      "/dashboard/projects/$projectIdentifier/buildings",
      data.cause,
      startedAt,
      "success"
    );

    return {
      status: "success",
      data: {
        buildings,
        project: {
          id: resolved.project.id,
          name: resolved.project.name,
          slug: resolved.project.slug,
        },
      },
    } satisfies PageDataResult<
      {
        buildings: Awaited<ReturnType<typeof listBuildingsForProjectQuery>>;
        project: {
          id: string;
          name: string;
          slug: string;
        };
      },
      typeof data.params
    >;
  });

export const getBuildingPageDataServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => buildingPageDataInputSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    const resolved = await resolveBuildingRoute(data.params, "view");

    if (!resolved) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
        data.cause,
        startedAt,
        "not_found"
      );
      return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
    }

    if (!resolved.isCanonical) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
        data.cause,
        startedAt,
        "redirect"
      );
      return {
        status: "redirect",
        canonicalParams: resolved.canonicalParams,
      } satisfies PageDataResult<never, typeof data.params>;
    }

    const detail = await getBuildingDetailQuery(resolved.building.id);

    if (!detail) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
        data.cause,
        startedAt,
        "not_found"
      );
      return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
    }

    logPageDataDuration(
      "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
      data.cause,
      startedAt,
      "success"
    );

    return {
      status: "success",
      data: detail,
    } satisfies PageDataResult<
      Awaited<ReturnType<typeof getBuildingDetailQuery>>,
      typeof data.params
    >;
  });

export const getFloorPageDataServerFn = createServerFn({
  method: "GET",
})
  .validator((input) => floorPageDataInputSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    const resolved = await resolveFloorRoute(data.params, "view");

    if (!resolved) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
        data.cause,
        startedAt,
        "not_found"
      );
      return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
    }

    if (!resolved.isCanonical) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
        data.cause,
        startedAt,
        "redirect"
      );
      return {
        status: "redirect",
        canonicalParams: resolved.canonicalParams,
      } satisfies PageDataResult<never, typeof data.params>;
    }

    const detail = await getFloorDetailQuery(resolved.floor.id);

    if (!detail) {
      logPageDataDuration(
        "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
        data.cause,
        startedAt,
        "not_found"
      );
      return { status: "not_found" } satisfies PageDataResult<never, typeof data.params>;
    }

    logPageDataDuration(
      "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
      data.cause,
      startedAt,
      "success"
    );

    return {
      status: "success",
      data: detail,
    } satisfies PageDataResult<
      Awaited<ReturnType<typeof getFloorDetailQuery>>,
      typeof data.params
    >;
  });
