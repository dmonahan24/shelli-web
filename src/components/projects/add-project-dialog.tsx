import * as React from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { AddProjectButton } from "@/components/projects/add-project-button";
import { ProjectForm } from "@/components/projects/project-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createProjectServerFn } from "@/server/projects/create-project";

export function AddProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <>
      <AddProjectButton onClick={() => setOpen(true)} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={(values, setFieldError) =>
              startTransition(async () => {
                const result = await createProjectServerFn({ data: values });

                if (!result.ok) {
                  for (const [fieldName, message] of Object.entries(
                    (result.fieldErrors ?? {}) as Record<string, string>
                  )) {
                    setFieldError(fieldName as keyof typeof values, message);
                  }

                  if (!result.fieldErrors) {
                    toast.error(result.formError ?? "Unable to create project.");
                  }

                  return;
                }

                toast.success(result.message ?? "Project created.");
                setOpen(false);
                await router.invalidate();
              })
            }
            submitButton={
              <SubmitButton pending={isPending} className="w-full sm:w-auto">
                Save Project
              </SubmitButton>
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
