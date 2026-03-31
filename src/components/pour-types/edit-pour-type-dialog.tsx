import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { PourTypeForm } from "@/components/pour-types/pour-type-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updatePourTypeServerFn } from "@/server/pour-types/update-pour-type";

export function EditPourTypeDialog({
  onUpdated,
  pourType,
  trigger,
}: {
  onUpdated: () => Promise<void> | void;
  pourType: {
    actualConcrete: number;
    displayOrder: number;
    estimatedConcrete: number;
    id: string;
    name: string;
    notes: string | null;
    pourCategory: "footings" | "grade_beams" | "slab" | "columns" | "shear_walls" | "core_walls" | "stairs" | "elevator_pit" | "deck" | "other";
    status: "not_started" | "in_progress" | "completed";
  };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit Pour Type</DialogTitle>
        </DialogHeader>
        <PourTypeForm
          defaultValues={{
            name: pourType.name,
            pourCategory: pourType.pourCategory,
            estimatedConcrete: pourType.estimatedConcrete,
            actualConcrete: pourType.actualConcrete,
            status: pourType.status,
            notes: pourType.notes ?? "",
            displayOrder: pourType.displayOrder,
          }}
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await updatePourTypeServerFn({
                data: {
                  pourTypeId: pourType.id,
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
                  toast.error(result.formError ?? "Unable to update pour type.");
                }

                return;
              }

              toast.success(result.message ?? "Pour type updated.");
              setOpen(false);
              await onUpdated();
            })
          }
          submitButton={
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Save Changes
            </SubmitButton>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
