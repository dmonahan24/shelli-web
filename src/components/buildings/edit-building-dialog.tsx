import * as React from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { BuildingForm } from "@/components/buildings/building-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateBuildingServerFn } from "@/server/buildings/update-building";

export function EditBuildingDialog({
  building,
  onUpdated,
  trigger,
}: {
  building: {
    code: string | null;
    description: string | null;
    displayOrder: number;
    id: string;
    name: string;
    slug?: string | null;
  };
  onUpdated: (result: {
    id: string;
    slug: string;
    projectId: string;
    projectSlug: string;
  }) => Promise<void> | void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit Building</DialogTitle>
        </DialogHeader>
        <BuildingForm
          defaultValues={{
            name: building.name,
            code: building.code ?? "",
            description: building.description ?? "",
            displayOrder: building.displayOrder,
          }}
          onSubmit={(values, setFieldError) =>
            startTransition(async () => {
              const result = await updateBuildingServerFn({
                data: {
                  buildingId: building.id,
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
                  toast.error(result.formError ?? "Unable to update building.");
                }

                return;
              }

              toast.success(result.message ?? "Building updated.");
              setOpen(false);
              await onUpdated(result.data);
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
