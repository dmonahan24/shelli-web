import { Link } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    label: "Dashboard Home",
    to: "/dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    to: "/dashboard/projects" as const,
    icon: ClipboardList,
  },
];

export function SidebarNavLinks() {
  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild>
            <Link
              to={item.to}
              activeOptions={{ exact: item.to === "/dashboard" }}
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
