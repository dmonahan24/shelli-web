import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type TimeseriesPoint } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard, ChartTooltipConcreteUnits } from "@/components/analytics/chart-card";

export function ConcretePouredOverTimeChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Concrete Poured Over Time" description="Daily placed volume across the selected range.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Concrete Poured Over Time" description="Daily placed volume across the selected range.">
      <ChartContainer
        className="h-[220px] w-full md:h-[280px]"
        config={{ value: { label: "Concrete", color: "#8b5e34" } }}
      >
        <AreaChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={32} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span className="font-medium">{ChartTooltipConcreteUnits(Number(value))}</span>
                )}
              />
            }
          />
          <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.18} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
