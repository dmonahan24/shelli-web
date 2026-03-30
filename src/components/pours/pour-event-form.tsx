import type { ComponentProps, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Control, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumericInputField } from "@/components/projects/numeric-input-field";
import {
  createPourEventSchema,
  type CreatePourEventInput,
} from "@/lib/validation/pour-event";

export function PourEventForm({
  defaultValues,
  onSubmit,
  submitButton,
}: {
  defaultValues: CreatePourEventInput;
  onSubmit: (
    values: CreatePourEventInput,
    setFieldError: (field: keyof CreatePourEventInput, message: string) => void
  ) => void;
  submitButton: ReactNode;
}) {
  const form = useForm<CreatePourEventInput>({
    resolver: zodResolver(createPourEventSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSubmit(values, (field, message) => form.setError(field, { message }))
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pourDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pour Date</FormLabel>
                <FormControl>
                  <PourDatePicker {...field} />
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
                <FormLabel>Concrete Amount</FormLabel>
                <FormControl>
                  <ConcreteAmountInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="locationDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Description</FormLabel>
              <FormControl>
                <Input placeholder="North wall strip footing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mixType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mix Type</FormLabel>
              <FormControl>
                <Input placeholder="4,000 PSI pump mix" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SupplierInputGroup control={form.control} />
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="weatherNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weather Notes</FormLabel>
                <FormControl>
                  <NotesTextarea
                    placeholder="Cloud cover, rain delay, wind, or cold weather protection notes."
                    {...field}
                    value={field.value ?? ""}
                  />
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
                <FormLabel>Crew Notes</FormLabel>
                <FormControl>
                  <NotesTextarea
                    placeholder="Crew observations, sequencing notes, or finishing issues."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {submitButton}
      </form>
    </Form>
  );
}

export function ConcreteAmountInput(
  props: ComponentProps<typeof NumericInputField>
) {
  return <NumericInputField step="0.01" {...props} />;
}

export function PourDatePicker(props: ComponentProps<typeof Input>) {
  return <Input type="date" {...props} />;
}

export function NotesTextarea(props: ComponentProps<typeof Textarea>) {
  return <Textarea className="min-h-28" {...props} />;
}

export function SupplierInputGroup({
  control,
}: {
  control: Control<CreatePourEventInput>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="supplierName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Supplier Name</FormLabel>
            <FormControl>
              <Input placeholder="Empire Ready Mix" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="ticketNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ticket Number</FormLabel>
            <FormControl>
              <Input placeholder="TK-11482" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
