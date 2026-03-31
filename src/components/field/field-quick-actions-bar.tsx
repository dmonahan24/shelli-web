import { Camera, ClipboardPlus, FileText, NotebookPen } from "lucide-react";
import { getProjectIdentifier } from "@/lib/project-paths";

const actions = [
  { label: "Add Pour", icon: ClipboardPlus, suffix: "/pours/quick-add" },
  { label: "Photo", icon: Camera, suffix: "/photos/upload" },
  { label: "Ticket", icon: FileText, suffix: "/photos/upload" },
  { label: "Notes", icon: NotebookPen, suffix: "/pours/quick-add" },
];

export function FieldQuickActionsBar({
  project,
}: {
  project: {
    id: string;
    slug?: string | null;
  };
}) {
  const projectIdentifier = getProjectIdentifier(project);

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <a
          key={action.label}
          href={`/dashboard/field/projects/${projectIdentifier}${action.suffix}`}
          className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background px-2 py-3 text-center text-xs font-semibold"
        >
          <action.icon className="size-4" />
          <span>{action.label}</span>
        </a>
      ))}
    </div>
  );
}
