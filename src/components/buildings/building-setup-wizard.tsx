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

export function BuildingSetupWizard({
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
      topStandardLevel: 8,
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Quick Setup</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Building Setup Wizard</DialogTitle>
        </DialogHeader>
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          Start the hierarchy fast by creating the most common floors in one step.
        </div>
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
                  toast.error(result.formError ?? "Unable to set up building.");
                  return;
                }

                toast.success(result.message ?? "Building setup complete.");
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
                  <div className="space-y-1">
                    <FormLabel className="m-0">Include Foundation</FormLabel>
                    <p className="text-sm text-muted-foreground">Recommended for new structural planning.</p>
                  </div>
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
                  <div className="space-y-1">
                    <FormLabel className="m-0">Include Ground Level</FormLabel>
                    <p className="text-sm text-muted-foreground">Creates a Ground Level floor if one does not already exist.</p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topStandardLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Create standard floors through</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="8" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Standard floors will be created from Level 2 through this level.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton pending={isPending} className="w-full sm:w-auto">
              Run Setup
            </SubmitButton>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
