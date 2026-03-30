import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { type ProjectRankingDatum } from "@/server/analytics/calculations";
import { AnalyticsEmptyState, ChartCard, ChartTooltipConcreteUnits } from "@/components/analytics/chart-card";

export function TopProjectsChart({ data }: { data: ProjectRankingDatum[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Top Projects by Concrete" description="Highest-volume projects in the current filter set.">
        <AnalyticsEmptyState />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Top Projects by Concrete" description="Highest-volume projects in the current filter set.">
      <ChartContainer className="h-[240px] w-full md:h-[300px]" config={{ value: { label: "Concrete", color: "#8b5e34" } }}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="projectName" tickLine={false} axisLine={false} hide />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{String(item?.payload?.projectName ?? "")}</span>
                    <span>{ChartTooltipConcreteUnits(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
