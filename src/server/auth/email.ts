import nodemailer from "nodemailer";
import { env } from "@/lib/env/server";

type PasswordResetEmailInput = {
  email: string;
  fullName: string;
  resetUrl: string;
};

export function buildPasswordResetEmail({
  fullName,
  resetUrl,
}: PasswordResetEmailInput) {
  return {
    subject: "Reset your Concrete Pour Tracker password",
    text: `Hi ${fullName},

We received a request to reset your password.

Use this link to set a new password:
${resetUrl}

If you did not request this reset, you can ignore this email.
`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Reset your password</h2>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your Concrete Pour Tracker password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 16px; background: #8b5e34; color: white; text-decoration: none; border-radius: 8px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, paste this URL into your browser:</p>
        <p>${resetUrl}</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      </div>
    `,
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const message = buildPasswordResetEmail(input);

  if (!env.SMTP_HOST) {
    console.info("Password reset email preview", {
      to: input.email,
      ...message,
    });
    return;
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
  });

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: input.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
