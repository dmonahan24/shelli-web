import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type BreakdownDatum } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard, ChartLegendCompact } from "@/components/analytics/chart-card";

const statusColors = ["#8b5e34", "#d97706", "#0f766e", "#475569"];

export function ProjectStatusBreakdownChart({ data }: { data: BreakdownDatum[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Project Status Breakdown" description="Active, completed, and on-hold project mix.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Project Status Breakdown" description="Active, completed, and on-hold project mix.">
      <div className="space-y-3">
        <ChartContainer
          className="h-[220px] w-full md:h-[260px]"
          config={Object.fromEntries(data.map((item, index) => [item.label, { label: item.label, color: statusColors[index % statusColors.length] }]))}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={54} outerRadius={86}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={statusColors[index % statusColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ChartLegendCompact items={data.map((item, index) => ({ label: item.label, color: statusColors[index % statusColors.length] }))} />
      </div>
    </ChartCard>
  );
}
