import { createAPIFileRoute } from "@tanstack/react-start/api";
import { serveProjectAttachment } from "@/server/attachments/serve-project-attachment";

export const APIRoute = createAPIFileRoute(
  "/api/projects/$projectId/attachments/$attachmentId/file"
)({
  GET: ({ params, request }) =>
    serveProjectAttachment({
      attachmentId: params.attachmentId,
      projectId: params.projectId,
      request,
    }),
});
