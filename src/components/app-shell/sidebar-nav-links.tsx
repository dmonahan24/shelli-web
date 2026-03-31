// @ts-nocheck
import { BarChart3, BriefcaseBusiness, ClipboardList, LayoutDashboard, Smartphone, Users } from "lucide-react";
import { PendingLink } from "@/components/navigation/pending-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { TenantUserPrincipal } from "@/lib/auth/principal";

function canSeeAnalytics(role: TenantUserPrincipal["role"]) {
  return role !== "field_supervisor" && role !== "viewer";
}

function canSeeCompany(role: TenantUserPrincipal["role"]) {
  return role === "owner" || role === "admin";
}

export function SidebarNavLinks({ user }: { user: TenantUserPrincipal }) {
  const navigationItems = [
    {
      label: "Dashboard",
      to: "/dashboard" as const,
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Projects",
      to: "/dashboard/projects" as const,
      icon: ClipboardList,
      visible: true,
    },
    {
      label: "Analytics",
      to: "/dashboard/analytics" as const,
      icon: BarChart3,
      visible: canSeeAnalytics(user.role),
    },
    {
      label: "Field Mode",
      to: "/dashboard/field" as const,
      icon: Smartphone,
      visible: true,
    },
    {
      label: "Company",
      to: "/dashboard/company" as const,
      icon: Users,
      visible: canSeeCompany(user.role),
    },
    {
      label: "Settings",
      to: "/dashboard/settings" as const,
      icon: BriefcaseBusiness,
      visible: true,
    },
  ];

  return (
    <SidebarMenu>
      {navigationItems.filter((item) => item.visible).map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild>
            <PendingLink
              to={item.to}
              preload="intent"
              activeOptions={{ exact: item.to === "/dashboard" }}
              activeProps={{
                "data-active": true,
              }}
              className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </PendingLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
