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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getPourCategoryLabel,
  getPourTypeStatusLabel,
  pourCategoryValues,
  pourTypeStatusValues,
} from "@/lib/hierarchy";
import { pourTypeFormSchema, type PourTypeFormInput } from "@/lib/validation/pour-type";

export function PourTypeForm({
  defaultValues,
  onSubmit,
  submitButton,
}: {
  defaultValues?: Partial<PourTypeFormInput>;
  onSubmit: (
    values: PourTypeFormInput,
    setFieldError: (field: keyof PourTypeFormInput, message: string) => void
  ) => void;
  submitButton: ReactNode;
}) {
  const form = useForm<PourTypeFormInput>({
    resolver: zodResolver(pourTypeFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      pourCategory: defaultValues?.pourCategory ?? "other",
      estimatedConcrete: defaultValues?.estimatedConcrete ?? 0,
      actualConcrete: defaultValues?.actualConcrete ?? 0,
      status: defaultValues?.status ?? "not_started",
      notes: defaultValues?.notes ?? "",
      displayOrder: defaultValues?.displayOrder,
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Slab" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pourCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pourCategoryValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {getPourCategoryLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pourTypeStatusValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {getPourTypeStatusLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="estimatedConcrete"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Concrete</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actualConcrete"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Concrete</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="displayOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-24"
                  placeholder="Optional notes or status details."
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
