// @ts-nocheck
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { type Control, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appUserRoleValues } from "@/lib/auth/principal";
import { companyOnboardingSchema, type CompanyOnboardingInput } from "@/lib/validation/company";
import { completeCompanyOnboardingServerFn } from "@/server/company/create-company";

export function CreateCompanyForm({ control }: { control: Control<CompanyOnboardingInput> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={control}
        name="companyName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company name</FormLabel>
            <FormControl>
              <Input placeholder="Bedrock Build" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="companySlug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company slug</FormLabel>
            <FormControl>
              <Input placeholder="bedrock-build" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function InviteTeammatesStep({ control }: { control: Control<CompanyOnboardingInput> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={control}
        name="teammateEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invite teammate</FormLabel>
            <FormControl>
              <Input type="email" placeholder="superintendent@company.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="teammateRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teammate role</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {appUserRoleValues.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function CreateFirstProjectStep({ control }: { control: Control<CompanyOnboardingInput> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="createProject"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-3">
            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
            <div>
              <FormLabel>Create my first project now</FormLabel>
              <p className="text-sm text-muted-foreground">Optional, but useful for getting into field workflows immediately.</p>
            </div>
          </FormItem>
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input placeholder="North Tower Deck" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="projectAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project address</FormLabel>
              <FormControl>
                <Input placeholder="12 Granite Ave, Rochester, NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="projectStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="projectEstimatedCompletionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated completion</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function CompanyOnboardingWizard({
  companyName,
  companySlug,
  role,
}: {
  companyName: string;
  companySlug: string;
  role: (typeof appUserRoleValues)[number];
}) {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();
  const form = useForm<CompanyOnboardingInput>({
    resolver: zodResolver(companyOnboardingSchema),
    defaultValues: {
      companyName,
      companySlug,
      userRole: role,
      teammateEmail: "",
      teammateRole: "viewer",
      createProject: false,
      projectName: "",
      projectAddress: "",
      projectCode: "",
      projectEstimatedTotalConcrete: 0,
      projectStartDate: "",
      projectEstimatedCompletionDate: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await completeCompanyOnboardingServerFn({ data: values });

      if (!result.ok) {
        toast.error(result.formError ?? "Unable to complete onboarding.");
        return;
      }

      toast.success(result.message ?? "Onboarding complete.");
      await navigate({ to: result.data.redirectTo });
    });
  });

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Company onboarding</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Step 1: Company</p>
              <CreateCompanyForm control={form.control} />
            </div>
            <FormField
              control={form.control}
              name="userRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>My role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appUserRoleValues.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Step 2: Invite teammates</p>
              <InviteTeammatesStep control={form.control} />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Step 3: First project</p>
              <CreateFirstProjectStep control={form.control} />
            </div>
            <Button disabled={isPending} className="w-full" type="submit">
              Finish Setup
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
