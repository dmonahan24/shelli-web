import { Link } from "@tanstack/react-router";

export function AuthFormFooter({
  prompt,
  linkLabel,
  to,
}: {
  prompt: string;
  linkLabel: string;
  to: "/auth/sign-in" | "/auth/create-account";
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link to={to} className="font-medium text-primary underline-offset-4 hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
