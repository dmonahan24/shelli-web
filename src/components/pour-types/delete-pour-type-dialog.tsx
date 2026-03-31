import * as React from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePourTypeServerFn } from "@/server/pour-types/delete-pour-type";
import { formatConcreteVolume } from "@/lib/utils/format";

export function DeletePourTypeDialog({
  onDeleted,
  pourType,
  trigger,
}: {
  onDeleted: () => Promise<void> | void;
  pourType: {
    actualConcrete: number;
    estimatedConcrete: number;
    id: string;
    name: string;
  };
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {pourType.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this pour type will recalculate the floor, building, and project totals.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Card className="rounded-[20px] border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delete Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Estimated concrete affected: {formatConcreteVolume(pourType.estimatedConcrete)}</p>
            <p>Actual concrete affected: {formatConcreteVolume(pourType.actualConcrete)}</p>
            <p className="font-medium text-destructive">This action cannot be undone.</p>
          </CardContent>
        </Card>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await deletePourTypeServerFn({
                  data: {
                    pourTypeId: pourType.id,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to delete pour type.");
                  return;
                }

                toast.success(result.message ?? "Pour type deleted.");
                await onDeleted();
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete Pour Type"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
