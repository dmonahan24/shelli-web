import { createServerFn } from "@tanstack/start-client-core";
import {
  approveAccessRequestSchema,
  rejectAccessRequestSchema,
} from "@/lib/validation/admin";
import {
  approveAccessRequest,
  listAccessRequests,
  rejectAccessRequest,
} from "@/server/admin/service";

export const listAccessRequestsServerFn = createServerFn({ method: "GET" }).handler(
  async () => listAccessRequests()
);

export const approveAccessRequestServerFn = createServerFn({ method: "POST" })
  .validator(approveAccessRequestSchema)
  .handler(async ({ data }) => approveAccessRequest(data));

export const rejectAccessRequestServerFn = createServerFn({ method: "POST" })
  .validator(rejectAccessRequestSchema)
  .handler(async ({ data }) => rejectAccessRequest(data));
