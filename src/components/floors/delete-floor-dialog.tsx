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
import { deleteFloorServerFn } from "@/server/floors/delete-floor";
import { formatConcreteVolume } from "@/lib/utils/format";

export function DeleteFloorDialog({
  floor,
  onDeleted,
  trigger,
}: {
  floor: {
    actualConcreteTotal: number;
    estimatedConcreteTotal: number;
    id: string;
    name: string;
    pourTypeCount: number;
  };
  onDeleted: () => Promise<void> | void;
  trigger: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {floor.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the floor and all child pour types.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Card className="rounded-[20px] border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delete Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{floor.pourTypeCount} pour type(s) will be removed.</p>
            <p>Estimated concrete affected: {formatConcreteVolume(floor.estimatedConcreteTotal)}</p>
            <p>Actual concrete affected: {formatConcreteVolume(floor.actualConcreteTotal)}</p>
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
                const result = await deleteFloorServerFn({
                  data: {
                    floorId: floor.id,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to delete floor.");
                  return;
                }

                toast.success(result.message ?? "Floor deleted.");
                await onDeleted();
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete Floor"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
