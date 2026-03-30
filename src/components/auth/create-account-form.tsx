import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
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
import { Input } from "@/components/ui/input";
import {
  createAccountSchema,
  type CreateAccountInput,
} from "@/lib/validation/auth";
import { createAccountServerFn } from "@/server/auth/create-account";

export function CreateAccountForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createAccountServerFn({ data: values });

      if (!result.ok) {
        setFormError(result.formError ?? "Unable to create your account.");

        for (const [fieldName, message] of Object.entries(
          (result.fieldErrors ?? {}) as Record<string, string>
        )) {
          form.setError(fieldName as keyof CreateAccountInput, {
            message,
          });
        }

        if (!result.fieldErrors) {
          toast.error(result.formError ?? "Unable to create your account.");
        }

        return;
      }

      toast.success("Account created.");
      await navigate({ to: result.data.redirectTo });
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={onSubmit}>
        {formError ? (
          <AuthAlert title="Create account failed" message={formError} />
        ) : null}
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Jordan Smith" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="superintendent@concreteco.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton pending={isPending} className="w-full">
          Create Account
        </SubmitButton>
        <AuthFormFooter
          prompt="Already have an account?"
          linkLabel="Sign in"
          to="/auth/sign-in"
        />
      </form>
    </Form>
  );
}
