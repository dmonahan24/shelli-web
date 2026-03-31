import { createFileRoute, redirect } from "@tanstack/react-router";
import { hierarchyBuildingParamsSchema } from "@/lib/validation/hierarchy";

export const Route = createFileRoute("/dashboard/projects/$projectId/buildings/$buildingId/edit")({
  loader: async ({ params }) => {
    const parsedParams = hierarchyBuildingParamsSchema.parse(params);

    throw redirect({
      to: "/dashboard/projects/$projectId/buildings/$buildingId",
      params: parsedParams,
    });
  },
});
