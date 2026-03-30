import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { logoutServerFn } from "@/server/auth/logout";

export function SidebarFooterActions() {
  const navigate = useNavigate();
  const [isPending, startTransition] = React.useTransition();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/dashboard/settings">
            <Settings className="size-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() =>
            startTransition(async () => {
              const result = await logoutServerFn();
              if (!result.ok) {
                toast.error(result.formError ?? "Unable to sign out.");
                return;
              }

              toast.success("Signed out.");
              await navigate({ to: result.data.redirectTo });
            })
          }
          disabled={isPending}
        >
          <LogOut className="size-4" />
          <span>{isPending ? "Signing out..." : "Logout"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
