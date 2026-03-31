import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { BuildingForm } from "@/components/buildings/building-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBuildingServerFn } from "@/server/buildings/create-building";

export function AddBuildingDialog({
  onCreated,
  projectId,
  trigger,
}: {
  onCreated: () => Promise<void> | void;
  projectId: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add Building</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Building</DialogTitle>
        </DialogHeader>
        <BuildingForm
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await createBuildingServerFn({
                data: {
                  projectId,
                  ...values,
                },
              });

              if (!result.ok) {
                for (const [fieldName, message] of Object.entries(
                  (result.fieldErrors ?? {}) as Record<string, string>
                )) {
                  setFieldError(fieldName as keyof typeof values, message);
                }

                if (!result.fieldErrors) {
                  toast.error(result.formError ?? "Unable to create building.");
                }

                return;
              }

              toast.success(result.message ?? "Building created.");
              setOpen(false);
              await onCreated();
            })
          }
          submitButton={
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Save Building
            </SubmitButton>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
