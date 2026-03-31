type CachedValue<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const readCache = new Map<string, CachedValue<unknown>>();

export function cacheServerRead<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = readCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.value as Promise<T>;
  }

  const value = loader().catch((error) => {
    const latest = readCache.get(key);
    if (latest?.value === value) {
      readCache.delete(key);
    }
    throw error;
  });

  readCache.set(key, {
    expiresAt: now + ttlMs,
    value,
  });

  return value;
}

export function invalidateServerReadCache(prefix: string) {
  for (const key of readCache.keys()) {
    if (key.startsWith(prefix)) {
      readCache.delete(key);
    }
  }
}

export function buildServerReadCacheKey(parts: ReadonlyArray<unknown>) {
  return JSON.stringify(parts);
}
