import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { quickPourSchema, type QuickPourInput } from "@/lib/validation/field";
import { createQuickPourServerFn } from "@/server/field/create-quick-pour";

function createSubmissionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function QuickAmountPad({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[5, 10, 15, 20].map((amount) => (
        <Button key={amount} type="button" variant="outline" onClick={() => onChange(String(amount))}>
          {amount}
        </Button>
      ))}
    </div>
  );
}

export function SaveAndAddAnotherButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick}>
      Save And Add Another
    </Button>
  );
}

export function QuickPourSuccessSheet({
  onUploadPhoto,
  onViewProject,
}: {
  onUploadPhoto: () => void;
  onViewProject: () => void;
}) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/70">
      <CardContent className="space-y-3 p-4">
        <p className="font-semibold text-emerald-950">Pour saved</p>
        <div className="grid gap-2">
          <Button onClick={onUploadPhoto}>Upload Photo</Button>
          <Button variant="outline" onClick={onViewProject}>
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickPourForm({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<QuickPourInput>({
    resolver: zodResolver(quickPourSchema),
    defaultValues: {
      projectId,
      pourDate: new Date().toISOString().slice(0, 10),
      concreteAmount: 0,
      locationDescription: "",
      mixType: "",
      supplierName: "",
      ticketNumber: "",
      crewNotes: "",
      weatherNotes: "",
      clientSubmissionId: createSubmissionId(),
    },
  });

  const submit = (resetAfterSave: boolean) =>
    form.handleSubmit((values) => {
      startTransition(async () => {
        const result = await createQuickPourServerFn({ data: values });

        if (!result.ok) {
          toast.error(result.formError ?? "Unable to save the pour.");
          return;
        }

        toast.success(result.message ?? "Quick pour saved.");
        if (resetAfterSave) {
          form.reset({
            ...form.getValues(),
            concreteAmount: 0,
            locationDescription: "",
            mixType: "",
            supplierName: "",
            ticketNumber: "",
            crewNotes: "",
            weatherNotes: "",
            clientSubmissionId: createSubmissionId(),
          });
          return;
        }

        setShowSuccess(true);
      });
    })();

  return (
    <div className="space-y-4">
      {showSuccess ? (
        <QuickPourSuccessSheet
          onUploadPhoto={() => navigate({ to: `/dashboard/field/projects/${projectId}/photos/upload` as never })}
          onViewProject={() => navigate({ to: `/dashboard/field/projects/${projectId}` as never })}
        />
      ) : null}
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Pour</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
              <FormField
                control={form.control}
                name="pourDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pour date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="concreteAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concrete amount</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        type="number"
                        step="0.01"
                        value={field.value || ""}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <QuickAmountPad value={String(field.value ?? "")} onChange={(value) => field.onChange(Number(value))} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location description</FormLabel>
                    <FormControl>
                      <Input placeholder="South slab, phase 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ticketNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crewNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crew notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Optional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sticky bottom-4 space-y-2 bg-background/90 py-2 backdrop-blur">
                <Button disabled={isPending} className="w-full" onClick={() => submit(false)}>
                  Save Pour
                </Button>
                <SaveAndAddAnotherButton onClick={() => submit(true)} />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
