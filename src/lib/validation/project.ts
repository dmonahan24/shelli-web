import { z } from "zod";

const nonNegativeNumber = z.coerce
  .number({ invalid_type_error: "Enter a valid number" })
  .min(0, "Value must be 0 or greater");

export const projectStatusValues = ["active", "completed", "on_hold"] as const;

export const projectStatusSchema = z.enum(projectStatusValues);

const baseProjectSchema = z
  .object({
    name: z.string().trim().min(1, "Project name is required"),
    address: z.string().trim().min(1, "Project address is required"),
    status: projectStatusSchema.default("active"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be 2000 characters or fewer")
      .optional()
      .or(z.literal("")),
    projectCode: z
      .string()
      .trim()
      .max(64, "Project code must be 64 characters or fewer")
      .optional()
      .or(z.literal("")),
    dateStarted: z.string().min(1, "Date started is required"),
    estimatedCompletionDate: z
      .string()
      .min(1, "Estimated completion date is required"),
    estimatedTotalConcrete: nonNegativeNumber,
  })
  .refine(
    (value) => value.estimatedCompletionDate >= value.dateStarted,
    {
      path: ["estimatedCompletionDate"],
      message: "Estimated completion cannot be before the start date",
    }
  );

export const createProjectSchema = baseProjectSchema;

export const updateProjectSchema = baseProjectSchema;

export const projectSchema = createProjectSchema;

export const deleteProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type ProjectInput = CreateProjectInput;
