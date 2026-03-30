import { Input } from "@/components/ui/input";

export function NumericInputField(props: React.ComponentProps<typeof Input>) {
  return <Input inputMode="decimal" {...props} />;
}
