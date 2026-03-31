import * as React from "react";
import { Activity, Building2, Camera, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ssrTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

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

function normalizeEventType(eventType?: string | null) {
  const trimmed = eventType?.trim();
  return trimmed ? trimmed : "activity";
}

function normalizeSummary(summary?: string | null) {
  const trimmed = summary?.trim();
  return trimmed ? trimmed : "Activity updated";
}

function toIsoTimestamp(value: Date | string | null | undefined) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date(0).toISOString();
}

export function ActivityEventIcon({ eventType }: { eventType?: string | null }) {
  const Icon = iconForEventType(normalizeEventType(eventType));
  return <Icon className="size-4 text-muted-foreground" />;
}

export function ActivityFeedItem({
  item,
}: {
  item: {
    id: string;
    eventType?: string | null;
    summary?: string | null;
    actorName?: string | null;
    createdAt?: Date | string | null;
  };
}) {
  const eventType = normalizeEventType(item.eventType);
  const summary = normalizeSummary(item.summary);
  const isoTimestamp = toIsoTimestamp(item.createdAt);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
      <div className="mt-0.5 rounded-full bg-muted p-2">
        <ActivityEventIcon eventType={eventType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{item.actorName ?? "System"}</span>
          <span>•</span>
          <ActivityTimestamp isoTimestamp={isoTimestamp} />
        </div>
      </div>
      <Badge variant="secondary" className="capitalize">
        {eventType.replaceAll("_", " ")}
      </Badge>
    </div>
  );
}

function ActivityTimestamp({ isoTimestamp }: { isoTimestamp: string }) {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const formattedTimestamp = isHydrated
    ? new Date(isoTimestamp).toLocaleString()
    : `${ssrTimestampFormatter.format(new Date(isoTimestamp))} UTC`;

  return (
    <time dateTime={isoTimestamp} suppressHydrationWarning>
      {formattedTimestamp}
    </time>
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
    eventType?: string | null;
    summary?: string | null;
    actorName?: string | null;
    createdAt?: Date | string | null;
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
