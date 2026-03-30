import { beforeEach, describe, expect, it } from "bun:test";
import { buildPasswordResetEmail } from "@/server/auth/email";
import { getResetPasswordTokenStatus } from "@/server/auth/service";
import { assertRateLimit, clearRateLimitBuckets } from "@/lib/auth/rate-limit";

describe("auth flows", () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it("returns a missing-token state when reset token is absent", async () => {
    const result = await getResetPasswordTokenStatus();

    expect(result.valid).toBe(false);
    expect(result.status).toBe("missing");
  });

  it("returns a ready state when a reset token hash is present", async () => {
    const result = await getResetPasswordTokenStatus("not-a-real-token");

    expect(result.valid).toBe(true);
    expect(result.status).toBe("valid");
  });

  it("rate limits repeated attempts", () => {
    assertRateLimit("sign-in:test:user@example.com", 2, 60_000);
    assertRateLimit("sign-in:test:user@example.com", 2, 60_000);

    expect(() => assertRateLimit("sign-in:test:user@example.com", 2, 60_000)).toThrow(
      "Too many attempts. Please wait and try again."
    );
  });

  it("builds a password reset email with the reset url", () => {
    const email = buildPasswordResetEmail({
      email: "jordan@example.com",
      fullName: "Jordan Smith",
      resetUrl: "http://localhost:3001/auth/reset-password?token=abc123",
    });

    expect(email.subject).toContain("Reset");
    expect(email.text).toContain("abc123");
  });
});
