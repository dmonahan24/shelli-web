import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DateInputField } from "@/components/projects/date-input-field";
import { NumericInputField } from "@/components/projects/numeric-input-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectSchema,
  projectStatusValues,
  type ProjectInput,
} from "@/lib/validation/project";

export function ProjectForm({
  defaultValues,
  disableEstimatedTotalConcrete = false,
  onSubmit,
  submitButton,
}: {
  defaultValues?: Partial<ProjectInput>;
  disableEstimatedTotalConcrete?: boolean;
  onSubmit: (
    values: ProjectInput,
    setFieldError: (field: keyof ProjectInput, message: string) => void
  ) => void;
  submitButton: ReactNode;
}) {
  const form = useForm<ProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      address: defaultValues?.address ?? "",
      status: defaultValues?.status ?? "active",
      description: defaultValues?.description ?? "",
      projectCode: defaultValues?.projectCode ?? "",
      dateStarted: defaultValues?.dateStarted ?? "",
      estimatedCompletionDate: defaultValues?.estimatedCompletionDate ?? "",
      estimatedTotalConcrete: defaultValues?.estimatedTotalConcrete ?? 0,
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSubmit(values, (field, message) => form.setError(field, { message }))
        )}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="North Tower Parking Deck" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Address</FormLabel>
              <FormControl>
                <Input placeholder="12 Granite Ave, Rochester, NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="projectCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Code</FormLabel>
                <FormControl>
                  <Input placeholder="ROC-0426-PD" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select project status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projectStatusValues.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dateStarted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Started</FormLabel>
                <FormControl>
                  <DateInputField {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedCompletionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Completion Date</FormLabel>
                <FormControl>
                  <DateInputField {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="estimatedTotalConcrete"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Total Concrete</FormLabel>
              <FormControl>
                <NumericInputField step="0.01" {...field} disabled={disableEstimatedTotalConcrete} />
              </FormControl>
              {disableEstimatedTotalConcrete ? (
                <p className="text-sm text-muted-foreground">
                  This value is managed by the building, floor, and pour-type hierarchy.
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Scope notes, access constraints, sequencing details, or superintendent context."
                  className="min-h-28"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitButton}
      </form>
    </Form>
  );
}
