import { Activity, Building2, Camera, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function iconForEventType(eventType: string) {
  if (eventType.includes("attachment")) {
    return Camera;
  }

  if (eventType.includes("member")) {
    return Users;
  }

  if (eventType.includes("project")) {
    return Building2;
  }

  if (eventType.includes("pour")) {
    return ClipboardList;
  }

  return Activity;
}

export function ActivityEventIcon({ eventType }: { eventType: string }) {
  const Icon = iconForEventType(eventType);
  return <Icon className="size-4 text-muted-foreground" />;
}

export function ActivityFeedItem({
  item,
}: {
  item: {
    id: string;
    eventType: string;
    summary: string;
    actorName?: string | null;
    createdAt: Date | string;
  };
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
      <div className="mt-0.5 rounded-full bg-muted p-2">
        <ActivityEventIcon eventType={item.eventType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{item.actorName ?? "System"}</span>
          <span>•</span>
          <span>{new Date(item.createdAt).toLocaleString()}</span>
        </div>
      </div>
      <Badge variant="secondary" className="capitalize">
        {item.eventType.replaceAll("_", " ")}
      </Badge>
    </div>
  );
}

export function ActivityFilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  const filters = ["all", "project", "pour", "attachment", "member"];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            active === filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {filter === "all" ? "All Activity" : filter}
        </button>
      ))}
    </div>
  );
}

export function RecentActivityFeed({
  items,
  title = "Recent Activity",
}: {
  items: Array<{
    id: string;
    eventType: string;
    summary: string;
    actorName?: string | null;
    createdAt: Date | string;
  }>;
  title?: string;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity for this view yet.</p>
        ) : (
          items.map((item) => <ActivityFeedItem key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );
}
