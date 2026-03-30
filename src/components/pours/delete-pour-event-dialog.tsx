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
import { deletePourEventServerFn } from "@/server/pours/delete-pour-event";

export function DeletePourEventDialog({
  onDeleted,
  pourEvent,
  trigger,
}: {
  onDeleted: () => Promise<void> | void;
  pourEvent: {
    concreteAmount: number;
    id: string;
    locationDescription: string;
    pourDate: string;
  };
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this pour event?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this entry will update project totals and last pour date calculations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <p>Date: {pourEvent.pourDate}</p>
          <p>Amount: {pourEvent.concreteAmount.toFixed(2)} CY</p>
          <p>Location: {pourEvent.locationDescription}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await deletePourEventServerFn({
                  data: {
                    id: pourEvent.id,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to delete pour event.");
                  return;
                }

                toast.success(result.message ?? "Pour event deleted.");
                await onDeleted();
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
