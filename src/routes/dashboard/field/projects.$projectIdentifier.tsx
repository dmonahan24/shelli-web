import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/field/projects/$projectIdentifier")({
  component: Outlet,
});
