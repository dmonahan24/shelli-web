import { Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Users } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    label: "Admin Dashboard",
    to: "/admin" as const,
    icon: ShieldCheck,
  },
  {
    label: "Access Requests",
    to: "/admin/access-requests" as const,
    icon: Users,
  },
  {
    label: "Users",
    to: "/admin/users" as const,
    icon: Users,
  },
  {
    label: "Companies",
    to: "/admin/companies" as const,
    icon: Building2,
  },
];

export function AdminSidebarNavLinks() {
  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild>
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === "/admin" }}
              activeProps={{
                "data-active": true,
              }}
              className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
