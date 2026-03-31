import { createFileRoute, redirect } from "@tanstack/react-router";
import { hierarchyFloorParamsSchema } from "@/lib/validation/hierarchy";

export const Route = createFileRoute("/dashboard/projects/$projectId/buildings/$buildingId/floors/$floorId/edit")({
  loader: async ({ params }) => {
    const parsedParams = hierarchyFloorParamsSchema.parse(params);

    throw redirect({
      to: "/dashboard/projects/$projectId/buildings/$buildingId/floors/$floorId",
      params: parsedParams,
    });
  },
});
