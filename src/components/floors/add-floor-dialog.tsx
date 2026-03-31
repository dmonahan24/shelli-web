import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { FloorForm } from "@/components/floors/floor-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createFloorServerFn } from "@/server/floors/create-floor";

export function AddFloorDialog({
  buildingId,
  onCreated,
  trigger,
}: {
  buildingId: string;
  onCreated: () => Promise<void> | void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add Floor</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Floor</DialogTitle>
        </DialogHeader>
        <FloorForm
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await createFloorServerFn({
                data: {
                  buildingId,
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
                  toast.error(result.formError ?? "Unable to create floor.");
                }

                return;
              }

              toast.success(result.message ?? "Floor created.");
              setOpen(false);
              await onCreated();
            })
          }
          submitButton={
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Save Floor
            </SubmitButton>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
