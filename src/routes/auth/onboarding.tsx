// @ts-nocheck
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { CompanyOnboardingWizard } from "@/components/company/company-onboarding-wizard";
import { isTenantUserPrincipal } from "@/lib/auth/principal";
import { getCurrentPrincipalServerFn } from "@/server/auth/get-current-user";

export const Route = createFileRoute("/auth/onboarding")({
  beforeLoad: async () => {
    const principal = await getCurrentPrincipalServerFn();

    if (!principal || !isTenantUserPrincipal(principal)) {
      throw redirect({ to: "/auth/sign-in" });
    }

    return { user: principal };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = Route.useRouteContext();

  return (
    <AuthPageShell title="Welcome" description="Finish your company setup so analytics, field mode, and collaboration all start from the same workspace.">
      <CompanyOnboardingWizard companyName={user.companyName} companySlug={user.companySlug} role={user.role} />
    </AuthPageShell>
  );
}
