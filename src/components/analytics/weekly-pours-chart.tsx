import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type TimeseriesPoint } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard, ChartTooltipConcreteUnits } from "@/components/analytics/chart-card";

export function WeeklyPoursChart({ data }: { data: TimeseriesPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Pours Over Time" description="Recent placed volume by date.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Pours Over Time" description="Recent placed volume by date.">
      <ChartContainer className="h-[220px] w-full md:h-[280px]" config={{ value: { label: "Concrete", color: "#d97706" } }}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => <span className="font-medium">{ChartTooltipConcreteUnits(Number(value))}</span>}
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
