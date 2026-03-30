import { Input } from "@/components/ui/input";

export function DateInputField(props: React.ComponentProps<typeof Input>) {
  return <Input type="date" {...props} />;
}
