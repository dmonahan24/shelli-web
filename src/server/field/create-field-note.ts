import { createServerFn } from "@tanstack/start-client-core";
import { createFieldNoteSchema } from "@/lib/validation/field";
import { createFieldNote } from "@/server/field/service";

export const createFieldNoteServerFn = createServerFn({ method: "POST" })
  .validator(createFieldNoteSchema)
  .handler(async ({ data }) => createFieldNote(data));
