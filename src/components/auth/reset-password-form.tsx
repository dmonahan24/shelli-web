import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthAlert } from "@/components/auth/auth-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validation/auth";
import { resetPasswordServerFn } from "@/server/auth/reset-password";

export function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await resetPasswordServerFn({ data: values });

      if (!result.ok) {
        setFormError(result.formError ?? "Unable to reset your password.");

        if (!result.fieldErrors) {
          toast.error(result.formError ?? "Unable to reset your password.");
        }

        return;
      }

      toast.success(result.message ?? "Password updated.");
      await navigate({ to: result.data.redirectTo });
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={onSubmit}>
        {formError ? <AuthAlert title="Reset failed" message={formError} /> : null}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton pending={isPending} className="w-full">
          Set New Password
        </SubmitButton>
      </form>
    </Form>
  );
}
