import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { PourTypeForm } from "@/components/pour-types/pour-type-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPourTypeServerFn } from "@/server/pour-types/create-pour-type";

export function AddPourTypeDialog({
  floorId,
  onCreated,
  trigger,
}: {
  floorId: string;
  onCreated: () => Promise<void> | void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add Pour Type</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Pour Type</DialogTitle>
        </DialogHeader>
        <PourTypeForm
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await createPourTypeServerFn({
                data: {
                  floorId,
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
                  toast.error(result.formError ?? "Unable to create pour type.");
                }

                return;
              }

              toast.success(result.message ?? "Pour type created.");
              setOpen(false);
              await onCreated();
            })
          }
          submitButton={
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Save Pour Type
            </SubmitButton>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
