import { differenceInCalendarDays } from "date-fns";

export type TimeseriesPoint = {
  date: string;
  value: number;
};

export type BreakdownDatum = {
  label: string;
  value: number;
};

export type ProjectRankingDatum = {
  projectId: string;
  projectSlug?: string;
  projectName: string;
  value: number;
};

export type DocumentationSignal = "green" | "yellow" | "red";
export type ScheduleRiskLevel = "low" | "medium" | "high";

export function calculatePercentComplete(totalConcretePoured: number, estimatedTotalConcrete: number) {
  if (estimatedTotalConcrete <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (totalConcretePoured / estimatedTotalConcrete) * 100));
}

export function calculateRemainingConcrete(totalConcretePoured: number, estimatedTotalConcrete: number) {
  return Math.max(estimatedTotalConcrete - totalConcretePoured, 0);
}

export function calculateAveragePourSize(totalConcretePoured: number, pourCount: number) {
  if (pourCount <= 0) {
    return 0;
  }

  return totalConcretePoured / pourCount;
}

export function calculateDaysSinceLastPour(lastPourDate?: string | null, today = new Date()) {
  if (!lastPourDate) {
    return null;
  }

  return differenceInCalendarDays(today, new Date(`${lastPourDate}T00:00:00`));
}

export function getDocumentationCompletionSignal(input: {
  recentPourCount: number;
  recentDocumentedPourCount: number;
}) {
  if (input.recentPourCount === 0) {
    return "green" as DocumentationSignal;
  }

  if (input.recentDocumentedPourCount === 0) {
    return "red" as DocumentationSignal;
  }

  if (input.recentDocumentedPourCount < input.recentPourCount) {
    return "yellow" as DocumentationSignal;
  }

  return "green" as DocumentationSignal;
}

export function getScheduleRiskIndicator(input: {
  percentComplete: number;
  projectStartDate: string;
  estimatedCompletionDate: string;
  lastPourDate?: string | null;
  status: string;
  today?: Date;
}) {
  const today = input.today ?? new Date();
  const startDate = new Date(`${input.projectStartDate}T00:00:00`);
  const estimatedCompletionDate = new Date(`${input.estimatedCompletionDate}T00:00:00`);
  const elapsedDays = Math.max(differenceInCalendarDays(today, startDate), 0);
  const totalDays = Math.max(differenceInCalendarDays(estimatedCompletionDate, startDate), 1);
  const expectedProgressPercent = Math.min(100, (elapsedDays / totalDays) * 100);
  const daysSinceLastPour = calculateDaysSinceLastPour(input.lastPourDate, today);
  const daysUntilEstimatedCompletion = differenceInCalendarDays(estimatedCompletionDate, today);

  if (
    input.status === "active" &&
    daysUntilEstimatedCompletion <= 14 &&
    input.percentComplete + 15 < expectedProgressPercent
  ) {
    return "high" as ScheduleRiskLevel;
  }

  if (input.status === "active" && (daysSinceLastPour === null || daysSinceLastPour >= 14)) {
    return "medium" as ScheduleRiskLevel;
  }

  return "low" as ScheduleRiskLevel;
}

export function sumTimeseries(points: TimeseriesPoint[]) {
  return points.reduce((total, point) => total + point.value, 0);
}

export function buildDocumentationTasks(input: {
  projectName: string;
  recentPourCount: number;
  recentPhotoCount: number;
  recentTicketCount: number;
}) {
  const tasks: Array<{ title: string; severity: "warning" | "critical"; description: string }> = [];

  if (input.recentPourCount > 0 && input.recentPhotoCount === 0) {
    tasks.push({
      title: "Recent Pours Missing Photos",
      severity: "critical",
      description: `${input.projectName} has recent pour activity without site photo documentation.`,
    });
  }

  if (input.recentTicketCount < input.recentPourCount) {
    tasks.push({
      title: "Tickets Missing",
      severity: "warning",
      description: `${input.projectName} has fewer delivery tickets than recent pours.`,
    });
  }

  return tasks;
}
