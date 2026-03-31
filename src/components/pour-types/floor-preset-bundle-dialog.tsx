import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPourCategoryLabel,
  getPourTypePresetBundleLabel,
  pourTypePresetBundles,
} from "@/lib/hierarchy";
import { applyPourTypePresetBundleServerFn } from "@/server/pour-types/apply-preset-bundle";

export function FloorPresetBundleDialog({
  defaultBundle,
  floorId,
  onApplied,
}: {
  defaultBundle: "foundation" | "standard";
  floorId: string;
  onApplied: () => Promise<void> | void;
}) {
  const [bundle, setBundle] = React.useState<"foundation" | "standard">(defaultBundle);
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const presets = pourTypePresetBundles[bundle];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Preset Bundle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>Add Preset Pour Types</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Preset Bundle</p>
            <Select value={bundle} onValueChange={(value) => setBundle(value as typeof bundle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foundation">
                  {getPourTypePresetBundleLabel("foundation")}
                </SelectItem>
                <SelectItem value="standard">
                  {getPourTypePresetBundleLabel("standard")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">This bundle will add:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {presets.map((preset) => (
                <p key={preset.name}>
                  {preset.name} · {getPourCategoryLabel(preset.pourCategory)}
                </p>
              ))}
            </div>
          </div>
          <Button
            disabled={isPending}
            className="w-full sm:w-auto"
            onClick={() =>
              startTransition(async () => {
                const result = await applyPourTypePresetBundleServerFn({
                  data: {
                    bundle,
                    floorId,
                  },
                });

                if (!result.ok) {
                  toast.error(result.formError ?? "Unable to add the preset pour types.");
                  return;
                }

                toast.success(result.message ?? "Preset pour types added.");
                setOpen(false);
                await onApplied();
              })
            }
            type="button"
          >
            {isPending ? "Applying..." : "Apply Bundle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
