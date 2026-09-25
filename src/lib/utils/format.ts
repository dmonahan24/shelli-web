import { format } from "date-fns";

export function formatDate(date: string | Date) {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return format(value, "MMM d, yyyy");
}

export function formatDateTime(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, "MMM d, yyyy h:mm a");
}

export function formatConcreteVolume(value: number) {
  return `${value.toFixed(2)} CY`;
}

/** Collapses whitespace and clips to `maxLength`, for one-line activity summaries. */
export function truncateText(value: string, maxLength: number) {
  const collapsed = value.replace(/\s+/g, " ").trim();

  if (collapsed.length <= maxLength) {
    return collapsed;
  }

  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
