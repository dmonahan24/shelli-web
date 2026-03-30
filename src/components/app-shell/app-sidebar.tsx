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

export function AppSidebar({
  user,
}: {
  user: {
    fullName: string;
    email: string;
  };
}) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <HardHat className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Concrete Pour Tracker</p>
            <p className="text-xs text-muted-foreground">Construction operations</p>
          </div>
        </div>
        <UserProfileCard fullName={user.fullName} email={user.email} />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="p-3">
        <SidebarNavLinks />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarFooterActions />
      </SidebarFooter>
    </Sidebar>
  );
}
