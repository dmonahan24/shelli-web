import { createFileRoute, redirect } from "@tanstack/react-router";
import { hierarchyFloorRouteParamsSchema } from "@/lib/validation/hierarchy";

export const Route = createFileRoute("/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier/edit")({
  loader: async ({ params }) => {
    const parsedParams = hierarchyFloorRouteParamsSchema.parse(params);

    throw redirect({
      to: "/dashboard/projects/$projectIdentifier/buildings/$buildingIdentifier/floors/$floorIdentifier",
      params: parsedParams,
    });
  },
});
