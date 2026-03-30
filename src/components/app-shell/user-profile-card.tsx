import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/lib/utils/format";

export function UserProfileCard({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  return (
    <Card className="border-sidebar-border/70 bg-sidebar-accent/50 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="size-11 border border-sidebar-border">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
