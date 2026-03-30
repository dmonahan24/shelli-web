import { createServerFn } from "@tanstack/start-client-core";
import { z } from "zod";
import { updateProjectSchema } from "@/lib/validation/project";
import { updateProject } from "@/server/projects/service";

const updateProjectServerSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
  values: updateProjectSchema,
});

export const updateProjectServerFn = createServerFn({ method: "POST" })
  .inputValidator(updateProjectServerSchema)
  .handler(async ({ data }) => updateProject(data.projectId, data.values));
