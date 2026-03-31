import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import { env } from "@/lib/env/server";

type RequestSpan = {
  name: string;
  durationMs: number;
  details?: Record<string, unknown>;
};

type RequestContextStore = {
  cache: Map<string, Promise<unknown>>;
  requestLabel: string;
  spans: RequestSpan[];
  startedAt: number;
};

type SpanOptions<T> = {
  details?: Record<string, unknown> | ((result: T) => Record<string, unknown> | undefined);
};

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();
const SLOW_REQUEST_THRESHOLD_MS = 300;

function formatSpanDetails(details?: Record<string, unknown>) {
  if (!details) {
    return "";
  }

  const parts = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`);

  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

function logRequestSummary(store: RequestContextStore) {
  const totalDurationMs = Math.round(performance.now() - store.startedAt);
  const shouldLog =
    env.NODE_ENV !== "production" || totalDurationMs >= SLOW_REQUEST_THRESHOLD_MS;

  if (!shouldLog) {
    return;
  }

  const formattedSpans = store.spans
    .map(
      (span) =>
        `${span.name}=${span.durationMs}ms${formatSpanDetails(span.details)}`
    )
    .join(" | ");

  const summary = formattedSpans ? ` | ${formattedSpans}` : "";
}

export function runWithRequestContext<T>(
  requestLabel: string,
  callback: () => Promise<T>
): Promise<T> {
  const existingStore = requestContextStorage.getStore();

  if (existingStore) {
    return callback();
  }

  const store: RequestContextStore = {
    cache: new Map(),
    requestLabel,
    spans: [],
    startedAt: performance.now(),
  };

  return requestContextStorage.run(store, async () => {
    try {
      return await callback();
    } finally {
      logRequestSummary(store);
    }
  });
}

export function memoizeRequestPromise<T>(
  key: string,
  loader: () => Promise<T>
): Promise<T> {
  const store = requestContextStorage.getStore();

  if (!store) {
    return loader();
  }

  const cached = store.cache.get(key);
  if (cached) {
    return cached as Promise<T>;
  }

  const value = loader().catch((error) => {
    store.cache.delete(key);
    throw error;
  });

  store.cache.set(key, value);
  return value;
}

export async function measureRequestSpan<T>(
  name: string,
  callback: () => Promise<T>,
  options?: SpanOptions<T>
): Promise<T> {
  const store = requestContextStorage.getStore();

  if (!store) {
    return callback();
  }

  const startedAt = performance.now();
  const result = await callback();
  const details =
    typeof options?.details === "function"
      ? options.details(result)
      : options?.details;

  store.spans.push({
    name,
    durationMs: Math.round(performance.now() - startedAt),
    details,
  });

  return result;
}
