import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route as DashboardRoute } from "@/routes/dashboard/route";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = DashboardRoute.useRouteContext();

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        subtitle="This is the initial placeholder for profile, password, notifications, and unit preferences."
      />
      <Card className="rounded-[28px] border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Signed in as <span className="font-medium text-foreground">{user.fullName}</span>.
          </p>
          <p>{user.email}</p>
          <p>
            Future settings hooks will land here for password changes, notifications, and units/preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
