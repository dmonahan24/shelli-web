import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddProjectButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="size-4" />
      Add Project
    </Button>
  );
}
