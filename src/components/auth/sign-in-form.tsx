import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFormFooter } from "@/components/auth/auth-form-footer";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { signInServerFn } from "@/server/auth/sign-in";

export function SignInForm() {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signInServerFn({ data: values });

      if (!result.ok) {
        setFormError(result.formError ?? "Unable to sign in.");

        if (!result.fieldErrors) {
          toast.error(result.formError ?? "Unable to sign in.");
        }

        return;
      }

      toast.success("Signed in.");
      await navigate({ to: result.data.redirectTo });
    });
  });

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={onSubmit}>
        {formError ? <AuthAlert title="Sign in failed" message={formError} /> : null}
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <FormControl>
                <PasswordInput autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                />
                <Label className="text-sm font-medium">Remember me on this device</Label>
              </div>
            </FormItem>
          )}
        />
        <SubmitButton pending={isPending} className="w-full">
          Sign In
        </SubmitButton>
        <AuthFormFooter
          prompt="Need an account?"
          linkLabel="Create Account"
          to="/auth/create-account"
        />
      </form>
    </Form>
  );
}
