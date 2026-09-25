import { Link } from "@tanstack/react-router";
import { Camera, ClipboardPlus, FileText, NotebookPen } from "lucide-react";
import { getProjectRouteParams } from "@/lib/project-paths";

const actions = [
  {
    label: "Add Pour",
    icon: ClipboardPlus,
    to: "/dashboard/field/projects/$projectIdentifier/pours/quick-add",
    search: {},
  },
  {
    label: "Photo",
    icon: Camera,
    to: "/dashboard/field/projects/$projectIdentifier/photos/upload",
    search: { type: "photo" },
  },
  {
    label: "Ticket",
    icon: FileText,
    to: "/dashboard/field/projects/$projectIdentifier/photos/upload",
    search: { type: "delivery_ticket" },
  },
  {
    label: "Notes",
    icon: NotebookPen,
    to: "/dashboard/field/projects/$projectIdentifier/notes",
    search: {},
  },
] as const;

export function FieldQuickActionsBar({
  project,
}: {
  project: {
    id: string;
    slug?: string | null;
  };
}) {
  const params = getProjectRouteParams(project);

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          params={params}
          search={action.search}
          className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-2 py-3 text-center text-xs font-semibold"
        >
          <action.icon className="size-4" />
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
