import { HardHat } from "lucide-react";
import { SidebarFooterActions } from "@/components/app-shell/sidebar-footer-actions";
import { SidebarNavLinks } from "@/components/app-shell/sidebar-nav-links";
import { UserProfileCard } from "@/components/app-shell/user-profile-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { TenantUserPrincipal } from "@/lib/auth/principal";

export function AppSidebar({
  user,
}: {
  user: TenantUserPrincipal;
}) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <HardHat className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Shelli Concrete Tracker</p>
            <p className="text-xs text-muted-foreground">Construction operations</p>
          </div>
        </div>
        <UserProfileCard fullName={user.fullName} email={user.email} />
        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/50 px-3 py-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Company
          </p>
          <p className="mt-1 text-sm font-semibold text-balance">{user.companyName}</p>
          <p className="text-xs text-muted-foreground">{user.role.replaceAll("_", " ")}</p>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="p-3">
        <SidebarNavLinks user={user} />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarFooterActions />
      </SidebarFooter>
    </Sidebar>
  );
}
