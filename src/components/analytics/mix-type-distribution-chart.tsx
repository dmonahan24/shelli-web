import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type BreakdownDatum } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard, ChartLegendCompact, ChartTooltipConcreteUnits } from "@/components/analytics/chart-card";

const mixColors = ["#8b5e34", "#0f766e", "#d97706", "#475569", "#be123c"];

export function MixTypeDistributionChart({ data }: { data: BreakdownDatum[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Mix Type Distribution" description="Concrete volume by captured mix type.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Mix Type Distribution" description="Concrete volume by captured mix type.">
      <div className="space-y-3">
        <ChartContainer
          className="h-[220px] w-full md:h-[260px]"
          config={Object.fromEntries(data.map((item, index) => [item.label, { label: item.label, color: mixColors[index % mixColors.length] }]))}
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => <span className="font-medium">{ChartTooltipConcreteUnits(Number(value))}</span>}
                />
              }
            />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={52} outerRadius={84}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={mixColors[index % mixColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ChartLegendCompact items={data.map((item, index) => ({ label: item.label, color: mixColors[index % mixColors.length] }))} />
      </div>
    </ChartCard>
  );
}
