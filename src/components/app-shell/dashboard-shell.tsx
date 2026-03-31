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
      <SidebarInset className="min-w-0">
        <div className="flex min-h-screen min-w-0 flex-col bg-[linear-gradient(180deg,_rgba(247,245,241,1)_0%,_rgba(255,255,255,1)_24%)]">
          <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur lg:px-6">
            <SidebarTrigger className="shrink-0 lg:hidden" />
            <div className="hidden h-6 w-px bg-border lg:block" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                {user.companyName}
              </p>
              <p className="text-sm font-medium text-balance">Concrete field operations</p>
            </div>
            <ShellNavigationFeedbackIndicator
              debugState={navigationFeedback.debugState}
              isAcknowledgingNavigation={navigationFeedback.isAcknowledgingNavigation}
              isSlowNavigation={navigationFeedback.isSlowNavigation}
              liveText={navigationFeedback.liveText}
            />
          </header>
          <main
            className="min-w-0 flex-1 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] transition-opacity lg:px-6 lg:py-6"
          >
            <div
              className="mx-auto w-full min-w-0 max-w-[88rem]"
              aria-busy={navigationFeedback.isSlowNavigation}
              aria-live="polite"
            >
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
