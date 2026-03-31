import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import {
  NavigationPendingIndicator,
  useNavigationPendingState,
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
  const { isNavigating, isVisible } = useNavigationPendingState();

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
            <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
              <span
                className={`size-2 rounded-full bg-primary transition-opacity ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
              />
              <span className={isVisible ? "opacity-100" : "opacity-0"}>
                Loading page...
              </span>
            </div>
            <NavigationPendingIndicator />
          </header>
          <main
            className="flex-1 px-4 py-6 transition-opacity md:px-6"
            aria-busy={isNavigating}
            aria-live="polite"
          >
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
