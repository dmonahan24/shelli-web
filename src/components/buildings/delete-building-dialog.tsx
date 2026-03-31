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
import { deleteBuildingServerFn } from "@/server/buildings/delete-building";
import { formatConcreteVolume } from "@/lib/utils/format";

export function DeleteBuildingDialog({
  building,
  onDeleted,
  trigger,
}: {
  building: {
    actualConcreteTotal: number;
    floorCount: number;
    id: string;
    name: string;
    pourTypeCount: number;
    estimatedConcreteTotal: number;
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
          <AlertDialogTitle>Delete {building.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the building and all of its child floors and pour types.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Card className="rounded-[20px] border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Delete Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{building.floorCount} floor(s) will be removed.</p>
            <p>{building.pourTypeCount} pour type(s) will be removed.</p>
            <p>Estimated concrete affected: {formatConcreteVolume(building.estimatedConcreteTotal)}</p>
            <p>Actual concrete affected: {formatConcreteVolume(building.actualConcreteTotal)}</p>
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
                const result = await deleteBuildingServerFn({
                  data: {
                    buildingId: building.id,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to delete building.");
                  return;
                }

                toast.success(result.message ?? "Building deleted.");
                await onDeleted();
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete Building"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
