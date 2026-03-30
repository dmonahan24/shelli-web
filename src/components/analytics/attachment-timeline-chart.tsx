import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type TimeseriesPoint } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard } from "@/components/analytics/chart-card";

export function AttachmentTimelineChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Attachment Timeline" description="Uploads captured across the selected range.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Attachment Timeline" description="Uploads captured across the selected range.">
      <ChartContainer className="h-[220px] w-full md:h-[280px]" config={{ value: { label: "Uploads", color: "#475569" } }}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
          <ChartTooltip
            content={
              <ChartTooltipContent formatter={(value) => <span className="font-medium">{Number(value)} uploads</span>} />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
