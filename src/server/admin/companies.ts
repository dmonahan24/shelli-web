import { createServerFn } from "@tanstack/start-client-core";
import {
  createCompanySchema,
  provisionCompanyUserSchema,
  toggleCompanyArchivedSchema,
  updateCompanySchema,
} from "@/lib/validation/admin";
import {
  createCompany,
  listCompaniesWithUsers,
  provisionCompanyUser,
  toggleCompanyArchived,
  updateCompany,
} from "@/server/admin/service";

export const listAdminCompaniesServerFn = createServerFn({ method: "GET" }).handler(
  async () => listCompaniesWithUsers()
);

export const createCompanyServerFn = createServerFn({ method: "POST" })
  .validator(createCompanySchema)
  .handler(async ({ data }) => createCompany(data));

export const provisionCompanyUserServerFn = createServerFn({ method: "POST" })
  .validator(provisionCompanyUserSchema)
  .handler(async ({ data }) => provisionCompanyUser(data));

export const updateCompanyServerFn = createServerFn({ method: "POST" })
  .validator(updateCompanySchema)
  .handler(async ({ data }) => updateCompany(data));

export const toggleCompanyArchivedServerFn = createServerFn({ method: "POST" })
  .validator(toggleCompanyArchivedSchema)
  .handler(async ({ data }) => toggleCompanyArchived(data));
