import { createServerFn } from "@tanstack/start-client-core";
import { deleteProjectSchema } from "@/lib/validation/project";
import { deleteProject } from "@/server/projects/service";

export const deleteProjectServerFn = createServerFn({ method: "POST" })
  .validator(deleteProjectSchema)
  .handler(async ({ data }) => deleteProject(data));
