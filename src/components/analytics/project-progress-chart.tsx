import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AnalyticsEmptyState, ChartCard, ChartLegendCompact, ChartTooltipConcreteUnits } from "@/components/analytics/chart-card";

export function ProjectProgressChart({
  data,
}: {
  data: Array<{ date: string; actual: number; estimated: number }>;
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Cumulative Progress" description="Actual cumulative poured volume versus estimated total.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Cumulative Progress" description="Actual cumulative poured volume versus estimated total.">
      <div className="space-y-3">
        <ChartContainer
          className="h-[220px] w-full md:h-[300px]"
          config={{
            actual: { label: "Actual", color: "#8b5e34" },
            estimated: { label: "Estimated Total", color: "#0f766e" },
          }}
        >
          <LineChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={32} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-medium">
                      {String(name)}: {ChartTooltipConcreteUnits(Number(value))}
                    </span>
                  )}
                />
              }
            />
            <Line dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={3} dot={false} />
            <Line dataKey="estimated" type="monotone" stroke="var(--color-estimated)" strokeDasharray="5 5" dot={false} />
          </LineChart>
        </ChartContainer>
        <ChartLegendCompact items={[{ label: "Actual", color: "#8b5e34" }, { label: "Estimated Total", color: "#0f766e" }]} />
      </div>
    </ChartCard>
  );
}
