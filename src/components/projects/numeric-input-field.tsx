import { Input } from "@/components/ui/input";

// Digits with an optional fraction of at most 2 places, matching the numeric(12, 2) volume columns.
const CONCRETE_VOLUME_INPUT_PATTERN = /^\d*(\.\d{0,2})?$/;

export function NumericInputField({ onChange, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      inputMode="decimal"
      {...props}
      onChange={(event) => {
        if (CONCRETE_VOLUME_INPUT_PATTERN.test(event.target.value)) {
          onChange?.(event);
        }
      }}
    />
  );
}
