import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { ProjectForm } from "@/components/projects/project-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProjectServerFn } from "@/server/projects/update-project";
import type { ProjectInput } from "@/lib/validation/project";

export function EditProjectForm({
  currentTotalConcretePoured,
  defaultValues,
  projectId,
}: {
  currentTotalConcretePoured: number;
  defaultValues: ProjectInput;
  projectId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const remainingConcrete = defaultValues.estimatedTotalConcrete - currentTotalConcretePoured;

  return (
    <div className="space-y-6">
      {defaultValues.status === "completed" && remainingConcrete > 0 ? (
        <Card className="rounded-[24px] border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="pt-6 text-sm text-amber-800">
            This project is marked completed, but it still shows positive remaining concrete.
          </CardContent>
        </Card>
      ) : null}
      <ProjectMetadataCard currentTotalConcretePoured={currentTotalConcretePoured} />
      <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            defaultValues={defaultValues}
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

                toast.success(result.message ?? "Project updated.");
                await router.navigate({ to: "/dashboard/projects/$projectId", params: { projectId } });
              })
            }
            submitButton={
              <SubmitButton pending={isPending} className="w-full sm:w-auto">
                Save Changes
              </SubmitButton>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProjectMetadataCard({
  currentTotalConcretePoured,
}: {
  currentTotalConcretePoured: number;
}) {
  return (
    <Card className="rounded-[24px] border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Project Metadata</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Total concrete poured is managed by the project’s pour event log and is currently{" "}
        <span className="font-semibold text-foreground">{currentTotalConcretePoured.toFixed(2)} CY</span>.
      </CardContent>
    </Card>
  );
}
