import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProjectServerFn } from "@/server/projects/delete-project";

export function DeleteProjectDialog({
  attachmentCount,
  pourEventCount,
  projectAddress,
  projectId,
  projectName,
}: {
  attachmentCount: number;
  pourEventCount: number;
  projectAddress: string;
  projectId: string;
  projectName: string;
}) {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {projectName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the project, its pour events, and its protected
            attachments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DeleteProjectSummary
          attachmentCount={attachmentCount}
          pourEventCount={pourEventCount}
          projectAddress={projectAddress}
          projectName={projectName}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await deleteProjectServerFn({
                  data: {
                    projectId,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to delete project.");
                  return;
                }

                toast.success(result.message ?? "Project deleted.");
                await navigate({ to: "/dashboard/projects" });
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteProjectSummary({
  attachmentCount,
  pourEventCount,
  projectAddress,
  projectName,
}: {
  attachmentCount: number;
  pourEventCount: number;
  projectAddress: string;
  projectName: string;
}) {
  return (
    <Card className="rounded-[20px] border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Delete Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium">{projectName}</p>
        <p className="text-muted-foreground">{projectAddress}</p>
        <p>{pourEventCount} pour event(s) will be removed.</p>
        <p>{attachmentCount} attachment(s) will be removed.</p>
        <p className="font-medium text-destructive">This action cannot be undone.</p>
      </CardContent>
    </Card>
  );
}

export function DangerZoneCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[24px] border-destructive/25 bg-destructive/5 shadow-sm">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
