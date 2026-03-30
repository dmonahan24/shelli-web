import { createServerFn } from "@tanstack/start-client-core";
import { createProjectSchema } from "@/lib/validation/project";
import { createProject } from "@/server/projects/service";

export const createProjectServerFn = createServerFn({ method: "POST" })
  .inputValidator(createProjectSchema)
  .handler(async ({ data }) => createProject(data));
