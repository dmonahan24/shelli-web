import { createServerFn } from "@tanstack/start-client-core";
import { listFieldNotesSchema } from "@/lib/validation/field";
import { listFieldNotes } from "@/server/field/service";

export const getFieldNotesServerFn = createServerFn({ method: "GET" })
  .validator(listFieldNotesSchema)
  .handler(async ({ data }) => listFieldNotes(data));
