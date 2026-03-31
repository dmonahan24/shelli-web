import { createFileRoute, redirect } from "@tanstack/react-router";
import { hierarchyBuildingRouteParamsSchema } from "@/lib/validation/hierarchy";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/edit")({
  loader: async ({ params }) => {
    const parsedParams = hierarchyBuildingRouteParamsSchema.parse(params);

    throw redirect({
      to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier",
      params: parsedParams,
    });
  },
});
