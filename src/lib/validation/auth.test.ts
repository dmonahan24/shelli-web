import { describe, expect, it } from "bun:test";
import {
  createAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validation/auth";

describe("auth validation", () => {
  it("normalizes email and validates create-account payloads", () => {
    const result = createAccountSchema.parse({
      fullName: "Jordan Smith",
      email: "Jordan@Example.com ",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.email).toBe("jordan@example.com");
  });

  it("rejects mismatched passwords", () => {
    const result = createAccountSchema.safeParse({
      fullName: "Jordan Smith",
      email: "jordan@example.com",
      password: "password123",
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
  });

  it("supports sign-in payloads with remember-me flags", () => {
    const result = signInSchema.parse({
      email: "crewlead@example.com",
      password: "password123",
      rememberMe: true,
    });

    expect(result.rememberMe).toBe(true);
  });

  it("validates forgot-password emails", () => {
    expect(
      forgotPasswordSchema.safeParse({
        email: "bad-email",
      }).success
    ).toBe(false);
  });

  it("validates reset-password payloads", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "abc123",
        password: "password123",
        confirmPassword: "password123",
      }).success
    ).toBe(true);
  });

  it("accepts reset-password payloads with Supabase recovery session tokens", () => {
    expect(
      resetPasswordSchema.safeParse({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        password: "password123",
        confirmPassword: "password123",
      }).success
    ).toBe(true);
  });
});
