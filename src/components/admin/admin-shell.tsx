import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { UserProfileCard } from "@/components/app-shell/user-profile-card";
import {
  ShellNavigationFeedbackIndicator,
  useShellNavigationFeedback,
} from "@/components/navigation/navigation-pending-indicator";
import { AdminSidebarFooterActions } from "@/components/admin/admin-sidebar-footer-actions";
import { AdminSidebarNavLinks } from "@/components/admin/admin-sidebar-nav-links";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AdminShell({
  user,
  children,
}: {
  user: {
    fullName: string;
    email: string;
  };
  children: ReactNode;
}) {
  const navigationFeedback = useShellNavigationFeedback();

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
        <SidebarHeader className="gap-5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Shelli Admin</p>
              <p className="text-xs text-muted-foreground">Platform provisioning</p>
            </div>
          </div>
          <UserProfileCard fullName={user.fullName} email={user.email} />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent className="p-3">
          <AdminSidebarNavLinks />
        </SidebarContent>
        <SidebarFooter className="p-3">
          <AdminSidebarFooterActions />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen min-w-0 flex-col bg-[linear-gradient(180deg,_rgba(247,245,241,1)_0%,_rgba(255,255,255,1)_24%)]">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="hidden h-6 w-px bg-border lg:block" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                Platform
              </p>
              <p className="text-sm font-medium">Admin provisioning console</p>
            </div>
            <ShellNavigationFeedbackIndicator
              debugState={navigationFeedback.debugState}
              isAcknowledgingNavigation={navigationFeedback.isAcknowledgingNavigation}
              isSlowNavigation={navigationFeedback.isSlowNavigation}
              liveText={navigationFeedback.liveText}
            />
          </header>
          <main
            className="min-w-0 flex-1 px-4 py-6 lg:px-6"
            aria-busy={navigationFeedback.isSlowNavigation}
            aria-live="polite"
          >
            <div className="mx-auto w-full min-w-0 max-w-[88rem]">{children}</div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
