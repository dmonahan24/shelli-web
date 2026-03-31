import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { bulkCreateFloorsSchema, type BulkCreateFloorsInput } from "@/lib/validation/floor";
import { bulkCreateFloorsServerFn } from "@/server/floors/bulk-create-floors";

export function BulkCreateFloorsDialog({
  buildingId,
  onCreated,
}: {
  buildingId: string;
  onCreated: () => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<BulkCreateFloorsInput>({
    resolver: zodResolver(bulkCreateFloorsSchema),
    defaultValues: {
      buildingId,
      includeFoundation: true,
      includeGroundLevel: true,
      topStandardLevel: 5,
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Multiple Floors</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Create Floors</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              startTransition(async () => {
                const result = await bulkCreateFloorsServerFn({
                  data: {
                    ...values,
                    buildingId,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to create floors.");
                  return;
                }

                toast.success(result.message ?? "Floors created.");
                setOpen(false);
                await onCreated();
              })
            )}
          >
            <FormField
              control={form.control}
              name="includeFoundation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 rounded-xl border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                  <FormLabel className="m-0">Include Foundation</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeGroundLevel"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 rounded-xl border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                  <FormLabel className="m-0">Include Ground Level</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topStandardLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Highest Standard Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="8"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
              Creates Standard floors from Level 2 through the highest level you enter.
            </div>
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Create Floors
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
