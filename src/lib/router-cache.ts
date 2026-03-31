export const READ_ROUTE_CACHE_OPTIONS = {
  staleTime: 10_000,
  preloadStaleTime: 30_000,
} as const;

export const SUMMARY_ROUTE_CACHE_OPTIONS = {
  staleTime: 30_000,
  preloadStaleTime: 60_000,
} as const;

export const HIERARCHY_ROUTE_CACHE_OPTIONS = {
  staleTime: 10_000,
  preloadStaleTime: 10_000,
} as const;
