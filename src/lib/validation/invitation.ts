import { z } from "zod";

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(1, "Invitation token is required"),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
