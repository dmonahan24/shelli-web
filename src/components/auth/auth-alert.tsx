import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AuthAlert({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
