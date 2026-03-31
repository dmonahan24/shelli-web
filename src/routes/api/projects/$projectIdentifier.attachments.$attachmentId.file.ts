import { createAPIFileRoute } from "@tanstack/react-start/api";
import { buildProjectAttachmentFilePath } from "@/lib/project-paths";
import { serveProjectAttachment } from "@/server/attachments/serve-project-attachment";
import { resolveProjectRoute } from "@/server/navigation/service";

export const APIRoute = createAPIFileRoute(
  "/api/projects/$projectIdentifier/attachments/$attachmentId/file"
)({
  GET: async ({ params, request }) => {
    const resolved = await resolveProjectRoute(params.projectIdentifier, "view");

    if (!resolved) {
      return new Response("Not found.", { status: 404 });
    }

    if (!resolved.isCanonical) {
      const url = new URL(
        buildProjectAttachmentFilePath(resolved.project, params.attachmentId),
        request.url
      );
      url.search = new URL(request.url).search;
      return Response.redirect(url, 302);
    }

    return serveProjectAttachment({
      attachmentId: params.attachmentId,
      projectId: resolved.project.id,
      request,
    });
  },
});
