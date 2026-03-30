import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthAlert } from "@/components/auth/auth-alert";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validation/auth";
import { forgotPasswordServerFn } from "@/server/auth/forgot-password";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = React.useTransition();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await forgotPasswordServerFn({ data: values });

      if (!result.ok) {
        setFormError(result.formError ?? "Unable to send reset instructions.");

        if (!result.fieldErrors) {
          toast.error(result.formError ?? "Unable to send reset instructions.");
        }

        return;
      }

      setSuccessMessage(result.message ?? result.data.message);
      toast.success("If that account exists, a reset link has been sent.");
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={onSubmit}>
        {formError ? <AuthAlert title="Request failed" message={formError} /> : null}
        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {successMessage}
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton pending={isPending} className="w-full">
          Send Reset Link
        </SubmitButton>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </Form>
  );
}
