import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import {
  ShellNavigationFeedbackIndicator,
  useShellNavigationFeedback,
} from "@/components/navigation/navigation-pending-indicator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { TenantUserPrincipal } from "@/lib/auth/principal";

export function DashboardShell({
  user,
  children,
}: {
  user: TenantUserPrincipal;
  children: ReactNode;
}) {
  const navigationFeedback = useShellNavigationFeedback();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,_rgba(247,245,241,1)_0%,_rgba(255,255,255,1)_24%)]">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden h-6 w-px bg-border md:block" />
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {user.companyName}
              </p>
              <p className="text-sm font-medium">Concrete field operations</p>
            </div>
            <ShellNavigationFeedbackIndicator
              debugState={navigationFeedback.debugState}
              isAcknowledgingNavigation={navigationFeedback.isAcknowledgingNavigation}
              isSlowNavigation={navigationFeedback.isSlowNavigation}
              liveText={navigationFeedback.liveText}
            />
          </header>
          <main
            className="flex-1 px-4 py-6 transition-opacity md:px-6"
            aria-busy={navigationFeedback.isSlowNavigation}
            aria-live="polite"
          >
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
