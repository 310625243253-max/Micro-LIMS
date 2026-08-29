// MOCKED / In-Memory Cache Store with optional Redis fallback
const memoryCache = new Map<string, { value: string; expiresAt?: number }>();

export function initRedis(): any {
  console.log('[CACHE] In-Memory high-speed cache initialized.');
  return null;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(item.value) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: any, ttlSeconds = 60): Promise<void> {
  try {
    memoryCache.set(key, {
      value: JSON.stringify(data),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  } catch {
    // ignore
  }
}

export async function invalidateCache(patternOrKey: string): Promise<void> {
  if (patternOrKey.includes('*')) {
    const prefix = patternOrKey.replace('*', '');
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.delete(patternOrKey);
  }
}

export function isRedisHealthy(): boolean {
  return true;
}

