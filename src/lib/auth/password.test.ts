import { describe, expect, it } from "bun:test";
import { hashPassword, normalizeEmail, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  SUPER@Example.com ")).toBe("super@example.com");
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });
});
