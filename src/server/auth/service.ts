import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { db } from "@/db";
import {
  createPasswordResetTokenRecord,
  createUser,
  findUserByEmail,
  findValidPasswordResetToken,
  invalidateUserPasswordResetTokens,
  markPasswordResetTokenUsed,
} from "@/db/queries/auth";
import { users } from "@/db/schema";
import { createRandomToken, hashToken } from "@/lib/auth/crypto";
import { PASSWORD_RESET_TTL_MS } from "@/lib/auth/constants";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { normalizeEmail, hashPassword, verifyPassword } from "@/lib/auth/password";
import { assertRateLimit } from "@/lib/auth/rate-limit";
import {
  createSession,
  getCurrentUser,
  getRequestIpAddress,
  revokeUserSessions,
} from "@/lib/auth/session";
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
import { env } from "@/lib/env/server";
import { sendPasswordResetEmail } from "@/server/auth/email";

function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

function isUniqueEmailError(error: unknown) {
  return error instanceof Error && error.message.includes("users.email");
}

export async function createAccount(
  rawInput: CreateAccountInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();

    const input = createAccountSchema.parse(rawInput);
    const normalizedEmail = normalizeEmail(input.email);

    const existingUser = await findUserByEmail(db, normalizedEmail);
    if (existingUser) {
      return failure("duplicate_email", "An account with that email already exists.", {
        email: "This email is already in use",
      });
    }

    const user = await createUser(db, {
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!user) {
      return failure("create_account_failed", "Unable to create your account.");
    }

    await createSession(user.id);

    return success({ redirectTo: "/dashboard" }, "Account created.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (isUniqueEmailError(error)) {
      return failure("duplicate_email", "An account with that email already exists.", {
        email: "This email is already in use",
      });
    }

    return failure("create_account_failed", "Something went wrong while creating your account.");
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

    const user = await findUserByEmail(db, email);
    if (!user) {
      return failure("invalid_credentials", "Invalid email or password.");
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      return failure("invalid_credentials", "Invalid email or password.");
    }

    await createSession(user.id, input.rememberMe);

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

    const user = await findUserByEmail(db, email);

    if (user) {
      const rawToken = createRandomToken();
      const tokenHash = hashToken(rawToken);

      await invalidateUserPasswordResetTokens(db, user.id);
      await createPasswordResetTokenRecord(db, {
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        createdAt: new Date(),
      });

      const resetUrl = `${env.APP_URL}/auth/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail({
        email: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    }

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

  const resetToken = await findValidPasswordResetToken(db, hashToken(token));

  if (!resetToken) {
    return {
      valid: false,
      status: "invalid" as const,
      message: "This reset link is invalid, expired, or already used.",
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
    const tokenHash = hashToken(input.token);
    const resetToken = await findValidPasswordResetToken(db, tokenHash);

    if (!resetToken) {
      return failure(
        "invalid_token",
        "This reset link is invalid, expired, or already used."
      );
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(input.password),
        updatedAt: new Date(),
      })
      .where(eq(users.id, resetToken.userId));

    await markPasswordResetTokenUsed(db, resetToken.id, new Date());
    await revokeUserSessions(resetToken.userId);

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
