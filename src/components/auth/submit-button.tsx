import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pending,
  className,
}: {
  children: ReactNode;
  pending: boolean;
  className?: string;
}) {
  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
