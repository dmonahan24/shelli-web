import { ZodError } from "zod";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { normalizeEmail } from "@/lib/auth/password";
import { assertRateLimit } from "@/lib/auth/rate-limit";
import {
  deleteSession,
  getCurrentUser,
  getRequestIpAddress,
  persistSession,
} from "@/lib/auth/session";
import { env } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  type CreateAccountInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
} from "@/lib/validation/auth";
import { failure, success, type ActionResult } from "@/lib/utils/action-result";

function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

export async function createAccount(
  rawInput: CreateAccountInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();
    createAccountSchema.parse(rawInput);
    return failure(
      "signup_disabled",
      "Account creation is invitation-only right now. Ask an administrator to provision your access."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }
    return failure("create_account_failed", "Unable to process that request right now.");
  }
}

export async function signIn(
  rawInput: SignInInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();

    const input = signInSchema.parse(rawInput);
    const email = normalizeEmail(input.email);
    const ipAddress = getRequestIpAddress();
    assertRateLimit(`sign-in:${ipAddress}:${email}`, 5, 1000 * 60 * 10);

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.session) {
      return failure("invalid_credentials", "Invalid email or password.");
    }

    persistSession(data.session, input.rememberMe);

    const user = await getCurrentUser();
    if (!user) {
      await deleteSession();
      return failure(
        "not_provisioned",
        "Your login is valid, but this app does not have a company profile for the account yet."
      );
    }

    return success({ redirectTo: "/dashboard" }, "Signed in.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message.includes("Too many attempts")) {
      return failure("rate_limited", error.message);
    }

    return failure("sign_in_failed", "Unable to sign in right now.");
  }
}

export async function forgotPassword(
  rawInput: ForgotPasswordInput
): Promise<ActionResult<{ message: string }>> {
  try {
    assertSameOrigin();

    const input = forgotPasswordSchema.parse(rawInput);
    const email = normalizeEmail(input.email);
    const ipAddress = getRequestIpAddress();
    assertRateLimit(`forgot-password:${ipAddress}:${email}`, 3, 1000 * 60 * 15);
    const supabase = createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.APP_URL}/auth/reset-password`,
    });

    return success(
      { message: "If that email exists, a reset link has been sent." },
      "If that email exists, a reset link has been sent."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please enter a valid email address.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message.includes("Too many attempts")) {
      return failure("rate_limited", error.message);
    }

    return failure("forgot_password_failed", "Unable to process that request right now.");
  }
}

export async function getResetPasswordTokenStatus(token?: string | null) {
  if (!token) {
    return {
      valid: false,
      status: "missing" as const,
      message: "This reset link is missing a token.",
    };
  }

  return {
    valid: true,
    status: "valid" as const,
    message: "Choose a new password for your account.",
  };
}

export async function resetPassword(
  rawInput: ResetPasswordInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();

    const input = resetPasswordSchema.parse(rawInput);
    const supabase = createSupabaseServerClient();
    const verifyResult = await supabase.auth.verifyOtp({
      token_hash: input.token,
      type: "recovery",
    });

    if (verifyResult.error || !verifyResult.data.session) {
      return failure(
        "invalid_token",
        "This reset link is invalid, expired, or already used."
      );
    }

    const updateResult = await supabase.auth.updateUser({
      password: input.password,
    });

    if (updateResult.error) {
      return failure("reset_password_failed", "Unable to reset your password right now.");
    }

    await deleteSession();

    return success(
      { redirectTo: "/auth/sign-in" },
      "Password updated. Please sign in with your new password."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    return failure("reset_password_failed", "Unable to reset your password right now.");
  }
}

export async function getAuthenticatedUser() {
  return getCurrentUser();
}
