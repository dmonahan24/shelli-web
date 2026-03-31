import { eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { db } from "@/db";
import { accessRequests, companies, companyInvitations, companyMemberships, users } from "@/db/schema";
import { assertSameOrigin } from "@/lib/auth/csrf";
import { hashToken } from "@/lib/auth/crypto";
import { getPrincipalHomePath, isPendingAccessPrincipal } from "@/lib/auth/principal";
import { normalizeEmail } from "@/lib/auth/password";
import { assertRateLimit } from "@/lib/auth/rate-limit";
import { resolvePrincipalFromAuthUser } from "@/lib/auth/resolve-principal";
import {
  deleteSession,
  getCurrentPrincipal,
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
import { slugifyCompanyName } from "@/server/company/service";

function zodFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened)
      .map(([key, value]) => [key, value?.[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

async function ensureAccessRequestForAuthUser(input: {
  authUserId: string;
  email: string;
  fullName: string;
}) {
  const existingRequest = await db.query.accessRequests.findFirst({
    where: eq(accessRequests.authUserId, input.authUserId),
  });

  if (existingRequest?.status === "rejected") {
    await db
      .update(accessRequests)
      .set({
        email: input.email,
        fullName: input.fullName,
        updatedAt: sql`now()`,
      })
      .where(eq(accessRequests.id, existingRequest.id));

    return;
  }

  await db
    .insert(accessRequests)
    .values({
      authUserId: input.authUserId,
      email: input.email,
      fullName: input.fullName,
      status: "pending",
      requestedAt: new Date(),
      resolvedAt: null,
      resolvedByPlatformAdminId: null,
      targetCompanyId: null,
      targetRole: null,
      notes: null,
    })
    .onConflictDoUpdate({
      target: accessRequests.authUserId,
      set: {
        email: input.email,
        fullName: input.fullName,
        status: "pending",
        requestedAt: new Date(),
        resolvedAt: null,
        resolvedByPlatformAdminId: null,
        targetCompanyId: null,
        targetRole: null,
        updatedAt: sql`now()`,
      },
    });
}

export async function createAccount(
  rawInput: CreateAccountInput
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    assertSameOrigin();
    const input = createAccountSchema.parse(rawInput);
    const email = normalizeEmail(input.email);
    const supabase = createSupabaseServerClient();
    const signUpResult = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName.trim(),
        },
      },
    });

    if (signUpResult.error || !signUpResult.data.user) {
      return failure("create_account_failed", signUpResult.error?.message ?? "Unable to create the account right now.");
    }

    const authUser = signUpResult.data.user;
    let redirectTo = "/auth/onboarding";

    if (input.inviteToken) {
      const invitation = await db.query.companyInvitations.findFirst({
        where: eq(companyInvitations.tokenHash, hashToken(input.inviteToken)),
      });

      if (
        invitation &&
        !invitation.acceptedAt &&
        !invitation.revokedAt &&
        invitation.expiresAt.getTime() > Date.now() &&
        invitation.email.toLowerCase() === email
      ) {
        await db.transaction(async (tx) => {
          await tx
            .insert(users)
            .values({
              id: authUser.id,
              companyId: invitation.companyId,
              role: invitation.role,
              email,
              fullName: input.fullName.trim(),
              isActive: true,
            })
            .onConflictDoUpdate({
              target: users.id,
              set: {
                companyId: invitation.companyId,
                role: invitation.role,
                email,
                fullName: input.fullName.trim(),
                isActive: true,
                updatedAt: new Date(),
              },
            });

          await tx
            .insert(companyMemberships)
            .values({
              companyId: invitation.companyId,
              userId: authUser.id,
              role: invitation.role,
              status: "active",
              invitedByUserId: invitation.invitedByUserId,
              joinedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [companyMemberships.companyId, companyMemberships.userId],
              set: {
                role: invitation.role,
                status: "active",
                joinedAt: new Date(),
                updatedAt: new Date(),
              },
            });

          await tx
            .update(companyInvitations)
            .set({
              acceptedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(companyInvitations.id, invitation.id));
        });

        redirectTo = "/dashboard/company";
      }
    } else {
      const baseSlug = slugifyCompanyName(input.fullName.split(" ")[0] ?? "company") || "company";
      let slug = baseSlug;
      let suffix = 1;
      while (await db.query.companies.findFirst({ where: eq(companies.slug, slug) })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      const [company] = await db
        .insert(companies)
        .values({
          name: `${input.fullName.trim()}'s Company`,
          slug,
          isActive: true,
        })
        .returning();

      if (!company) {
        return failure("create_account_failed", "Unable to create the company right now.");
      }

      await db.transaction(async (tx) => {
        await tx
          .insert(users)
          .values({
            id: authUser.id,
            companyId: company.id,
            role: "owner",
            email,
            fullName: input.fullName.trim(),
            isActive: true,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              companyId: company.id,
              role: "owner",
              email,
              fullName: input.fullName.trim(),
              isActive: true,
              updatedAt: new Date(),
            },
          });

        await tx.insert(companyMemberships).values({
          companyId: company.id,
          userId: authUser.id,
          role: "owner",
          status: "active",
          joinedAt: new Date(),
        });
      });
    }

    const session =
      signUpResult.data.session ??
      (await supabase.auth.signInWithPassword({
        email,
        password: input.password,
      })).data.session;

    if (session) {
      persistSession(session, true);
    }

    return success({ redirectTo }, "Account created.");
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

    let principal;

    try {
      principal = await resolvePrincipalFromAuthUser(data.session.user);
    } catch (principalError) {
      console.error("Unable to resolve Shelli access profile during sign-in.", {
        authUserId: data.session.user.id,
        email,
        error: principalError,
      });

      return failure(
        "profile_unavailable",
        "Your account was authenticated, but your Shelli access profile could not be loaded. Run bootstrap or contact an administrator."
      );
    }

    if (principal.kind === "inactive_tenant_user") {
      await deleteSession();
      return failure(
        "inactive_account",
        "This account is inactive right now. Contact a platform administrator for access."
      );
    }

    if (isPendingAccessPrincipal(principal)) {
      try {
        await ensureAccessRequestForAuthUser({
          authUserId: principal.id,
          email: principal.email,
          fullName: principal.fullName,
        });
      } catch (accessRequestError) {
        console.error("Unable to upsert pending access request during sign-in.", {
          authUserId: principal.id,
          email: principal.email,
          error: accessRequestError,
        });
      }
    }

    try {
      persistSession(data.session, input.rememberMe);
    } catch (sessionError) {
      console.error("Unable to persist session cookie during sign-in.", {
        authUserId: data.session.user.id,
        email,
        error: sessionError,
      });

      return failure(
        "session_unavailable",
        "Your account was authenticated, but the session could not be saved in this browser. Refresh and try again."
      );
    }

    return success({ redirectTo: getPrincipalHomePath(principal) }, "Signed in.");
  } catch (error) {
    if (error instanceof ZodError) {
      return failure("validation_error", "Please fix the highlighted fields.", zodFieldErrors(error));
    }

    if (error instanceof Error && error.message.includes("Too many attempts")) {
      return failure("rate_limited", error.message);
    }

    if (error instanceof Error && error.message === "Invalid request origin.") {
      return failure(
        "invalid_origin",
        "Sign-in was blocked because this browser origin does not match the app configuration. Make sure APP_URL matches the URL you opened and restart the dev server."
      );
    }

    console.error("Unexpected sign-in failure.", error);

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
    const hasRecoverySession = Boolean(input.accessToken && input.refreshToken);

    if (hasRecoverySession) {
      const recoveryResult = await supabase.auth.setSession({
        access_token: input.accessToken!,
        refresh_token: input.refreshToken!,
      });

      if (recoveryResult.error || !recoveryResult.data.session) {
        return failure(
          "invalid_token",
          "This reset link is invalid, expired, or already used."
        );
      }
    } else {
      const verifyResult = await supabase.auth.verifyOtp({
        token_hash: input.token!,
        type: "recovery",
      });

      if (verifyResult.error || !verifyResult.data.session) {
        return failure(
          "invalid_token",
          "This reset link is invalid, expired, or already used."
        );
      }
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

export async function getAuthenticatedPrincipal() {
  return getCurrentPrincipal();
}
