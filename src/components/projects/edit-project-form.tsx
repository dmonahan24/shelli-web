import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectTeamCard, type ProjectTeamRoster } from "@/components/projects/project-team-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectRouteParams } from "@/lib/project-paths";
import { buildProjectTeamChanges, draftFromRoster } from "@/lib/project-team";
import { bulkAssignProjectMembersServerFn } from "@/server/company/bulk-assign-project-members";
import { updateProjectServerFn } from "@/server/projects/update-project";
import type { ProjectInput } from "@/lib/validation/project";

const EDIT_PROJECT_FORM_ID = "edit-project-form";

export function EditProjectForm({
  currentTotalConcretePoured,
  defaultValues,
  isHierarchyManaged = false,
  projectId,
  teamRoster,
}: {
  currentTotalConcretePoured: number;
  defaultValues: ProjectInput;
  isHierarchyManaged?: boolean;
  projectId: string;
  /** Null when the current user cannot manage project access. */
  teamRoster: ProjectTeamRoster | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [teamDraft, setTeamDraft] = React.useState(() =>
    teamRoster ? draftFromRoster(teamRoster) : null
  );
  const remainingConcrete = defaultValues.estimatedTotalConcrete - currentTotalConcretePoured;

  // Project details and team access are separate server writes. Details save first; if the
  // team step fails we stay on the page with the team edits intact so they can be retried.
  const saveTeamChanges = async () => {
    if (!teamRoster || !teamDraft) {
      return true;
    }

    const changes = buildProjectTeamChanges(teamRoster, teamDraft);
    if (!changes.hasChanges) {
      return true;
    }

    const result = await bulkAssignProjectMembersServerFn({
      data: {
        projectId,
        assignments: changes.assignments,
        removals: changes.removals,
        projectManagerUserId: changes.projectManagerUserId,
        superintendentUserId: changes.superintendentUserId,
        projectAdminUserId: changes.projectAdminUserId,
      },
    });

    if (!result.ok) {
      toast.error(
        `Project details were saved, but the team was not. ${result.formError ?? "Please try again."}`
      );
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-6">
      {defaultValues.status === "completed" && remainingConcrete > 0 ? (
        <Card className="rounded-[24px] border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="pt-6 text-sm text-amber-800">
            This project is marked completed, but it still shows positive remaining concrete.
          </CardContent>
        </Card>
      ) : null}
      <ProjectMetadataCard
        currentTotalConcretePoured={currentTotalConcretePoured}
        isHierarchyManaged={isHierarchyManaged}
      />
      <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            id={EDIT_PROJECT_FORM_ID}
            defaultValues={defaultValues}
            disableEstimatedTotalConcrete={isHierarchyManaged}
            onSubmit={(values, setFieldError) =>
              startTransition(async () => {
                const result = await updateProjectServerFn({
                  data: {
                    projectId,
                    values,
                  },
                });

                if (!result.ok) {
                  for (const [fieldName, message] of Object.entries(
                    (result.fieldErrors ?? {}) as Record<string, string>
                  )) {
                    setFieldError(fieldName as keyof typeof values, message);
                  }

                  if (!result.fieldErrors) {
                    toast.error(result.formError ?? "Unable to update project.");
                  }

                  return;
                }

                if (!(await saveTeamChanges())) {
                  return;
                }

                toast.success(result.message ?? "Project updated.");
                await router.navigate({
                  to: "/dashboard/projects/$projectIdentifier",
                  params: getProjectRouteParams({
                    id: projectId,
                    slug: result.data?.slug,
                  }),
                });
              })
            }
            submitButton={null}
          />
        </CardContent>
      </Card>
      {teamRoster && teamDraft ? (
        <ProjectTeamCard
          roster={teamRoster}
          draft={teamDraft}
          onDraftChange={(update) => setTeamDraft((current) => (current ? update(current) : current))}
        />
      ) : null}
      <SubmitButton form={EDIT_PROJECT_FORM_ID} pending={isPending} className="w-full sm:w-auto">
        Save Changes
      </SubmitButton>
    </div>
  );
}

export function ProjectMetadataCard({
  currentTotalConcretePoured,
  isHierarchyManaged = false,
}: {
  currentTotalConcretePoured: number;
  isHierarchyManaged?: boolean;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Metadata</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Total concrete poured is currently{" "}
        <span className="font-semibold text-foreground">{currentTotalConcretePoured.toFixed(2)} CY</span>.
        {isHierarchyManaged
          ? " Estimated and actual planning totals are now driven by the building hierarchy."
          : " This project does not have hierarchy records yet, so the estimate is still managed here."}
      </CardContent>
    </Card>
  );
}
