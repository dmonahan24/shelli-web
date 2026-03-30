import * as React from "react";
import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { ProjectBreadcrumbs } from "@/components/projects/project-breadcrumbs";
import { PourEventForm } from "@/components/pours/pour-event-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailParamsSchema } from "@/lib/validation/project-list";
import { createPourEventServerFn } from "@/server/pours/create-pour-event";
import { getProjectDetailServerFn } from "@/server/projects/get-project-detail";

export const Route = createFileRoute("/dashboard/projects/$projectId/pours/new")({
  loader: async ({ params }) => {
    const parsedParams = projectDetailParamsSchema.parse(params);
    const detail = await getProjectDetailServerFn({ data: parsedParams });

    if (!detail) {
      throw notFound();
    }

    return detail;
  },
  component: NewPourEventPage,
});

function NewPourEventPage() {
  const router = useRouter();
  const detail = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const [isPending, startTransition] = React.useTransition();

  return (
    <div className="space-y-6">
      <ProjectBreadcrumbs projectName={detail.project.name} />
      <Card className="rounded-[28px] border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Add Pour Event</CardTitle>
        </CardHeader>
        <CardContent>
          <PourEventForm
            defaultValues={{
              projectId,
              pourDate: "",
              concreteAmount: 0,
              unit: "cubic_yards",
              locationDescription: "",
              mixType: "",
              supplierName: "",
              ticketNumber: "",
              weatherNotes: "",
              crewNotes: "",
            }}
            onSubmit={(values, setFieldError) =>
              startTransition(async () => {
                const result = await createPourEventServerFn({
                  data: values,
                });

                if (!result.ok) {
                  for (const [fieldName, message] of Object.entries(
                    (result.fieldErrors ?? {}) as Record<string, string>
                  )) {
                    setFieldError(fieldName as keyof typeof values, message);
                  }

                  if (!result.fieldErrors) {
                    toast.error(result.formError ?? "Unable to create pour event.");
                  }

                  return;
                }

                toast.success(result.message ?? "Pour event added.");
                await router.navigate({
                  to: "/dashboard/projects/$projectId",
                  params: { projectId },
                });
              })
            }
            submitButton={
              <SubmitButton pending={isPending} className="w-full sm:w-auto">
                Save Pour Event
              </SubmitButton>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
