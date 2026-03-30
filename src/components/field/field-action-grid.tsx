import { Link } from "@tanstack/react-router";
import { Camera, ClipboardPlus, FolderKanban, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const iconMap = {
  projects: FolderKanban,
  pour: ClipboardPlus,
  photo: Camera,
  activity: History,
};

export function FieldActionGrid({
  projectId,
}: {
  projectId?: string;
}) {
  const actions = [
    {
      key: "projects" as const,
      label: "My Projects",
      to: "/dashboard/field",
    },
    {
      key: "pour" as const,
      label: "Add Pour",
      to: projectId ? `/dashboard/field/projects/${projectId}/pours/quick-add` : "/dashboard/field",
    },
    {
      key: "photo" as const,
      label: "Upload Photo",
      to: projectId ? `/dashboard/field/projects/${projectId}/photos/upload` : "/dashboard/field",
    },
    {
      key: "activity" as const,
      label: "Recent Activity",
      to: "/dashboard/field",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = iconMap[action.key];

        return (
          <Link key={action.label} to={action.to}>
            <Card className="border-border/70 bg-background/95">
              <CardContent className="flex min-h-28 flex-col items-start justify-between p-4">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="text-base font-semibold">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
