import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pending,
  className,
  form,
}: {
  children: ReactNode;
  pending: boolean;
  className?: string;
  form?: string;
}) {
  return (
    <Button type="submit" form={form} className={className} disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
