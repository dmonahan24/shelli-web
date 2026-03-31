import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { FloorForm } from "@/components/floors/floor-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateFloorServerFn } from "@/server/floors/update-floor";

export function EditFloorDialog({
  floor,
  onUpdated,
  trigger,
}: {
  floor: {
    displayOrder: number;
    floorType: "foundation" | "ground" | "standard" | "basement" | "roof" | "other";
    id: string;
    levelNumber: number | null;
    name: string;
  };
  onUpdated: () => Promise<void> | void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit Floor</DialogTitle>
        </DialogHeader>
        <FloorForm
          defaultValues={{
            floorType: floor.floorType,
            levelNumber: floor.levelNumber ?? undefined,
            customName: floor.name,
            displayOrder: floor.displayOrder,
          }}
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await updateFloorServerFn({
                data: {
                  floorId: floor.id,
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
                  toast.error(result.formError ?? "Unable to update floor.");
                }

                return;
              }

              toast.success(result.message ?? "Floor updated.");
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
