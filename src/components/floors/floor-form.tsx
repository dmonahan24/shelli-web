import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { floorTypeValues } from "@/lib/hierarchy";
import { floorFormSchema, type FloorFormInput } from "@/lib/validation/floor";

function floorTypeLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function FloorForm({
  defaultValues,
  onSubmit,
  submitButton,
}: {
  defaultValues?: Partial<FloorFormInput>;
  onSubmit: (
    values: FloorFormInput,
    setFieldError: (field: keyof FloorFormInput, message: string) => void
  ) => void;
  submitButton: ReactNode;
}) {
  const form = useForm<FloorFormInput>({
    resolver: zodResolver(floorFormSchema),
    defaultValues: {
      floorType: defaultValues?.floorType ?? "foundation",
      levelNumber: defaultValues?.levelNumber,
      customName: defaultValues?.customName ?? "",
      displayOrder: defaultValues?.displayOrder,
    },
  });
  const floorType = useWatch({ control: form.control, name: "floorType" });

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
          name="floorType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Floor Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a floor type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {floorTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {floorTypeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {floorType === "standard" ? (
          <FormField
            control={form.control}
            name="levelNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2"
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="customName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional override, like Podium Transfer Level"
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
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input
                  placeholder="200"
                  type="number"
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
