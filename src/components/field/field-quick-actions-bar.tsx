import { Link } from "@tanstack/react-router";
import { Camera, ClipboardPlus, FileText, NotebookPen } from "lucide-react";

const actions = [
  { label: "Add Pour", icon: ClipboardPlus, suffix: "/pours/quick-add" },
  { label: "Photo", icon: Camera, suffix: "/photos/upload" },
  { label: "Ticket", icon: FileText, suffix: "/photos/upload" },
  { label: "Notes", icon: NotebookPen, suffix: "/pours/quick-add" },
];

export function FieldQuickActionsBar({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={`${`/dashboard/field/projects/${projectId}${action.suffix}`}` as never}
          className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-2 py-3 text-center text-xs font-semibold"
        >
          <action.icon className="size-4" />
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
