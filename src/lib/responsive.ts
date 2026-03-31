export function summarizeActiveFilters(
  filters: Array<string | null | undefined>,
  fallback = "No active filters"
) {
  const activeFilters = filters.filter(Boolean) as string[];

  if (activeFilters.length === 0) {
    return fallback;
  }

  if (activeFilters.length === 1) {
    return activeFilters[0];
  }

  if (activeFilters.length === 2) {
    return `${activeFilters[0]} and ${activeFilters[1]}`;
  }

  return `${activeFilters[0]}, ${activeFilters[1]}, +${activeFilters.length - 2} more`;
}

export function getActiveFilterCount(filters: Array<string | null | undefined>) {
  return filters.filter(Boolean).length;
}
