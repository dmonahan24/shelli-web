import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/projects/$projectId/buildings/$buildingId")({
  component: Outlet,
});
