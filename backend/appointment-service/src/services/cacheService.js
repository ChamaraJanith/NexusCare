/**
 * Simple in-memory cache with TTL support.
 * Acts as a fallback store when downstream services are unavailable.
 * Tracks cache freshness and invalidation metadata.
 */

const store = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STALE_DATA_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes max age for stale data

export const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
    isStale: false,
  });
};

export const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  return entry.value; // return even if stale — caller decides
};

export const isStale = (key) => {
  const entry = store.get(key);
  if (!entry) return true;
  return Date.now() > entry.expiresAt;
};

export const isExpiredStale = (key) => {
  const entry = store.get(key);
  if (!entry) return true;
  const age = Date.now() - entry.createdAt;
  return age > STALE_DATA_MAX_AGE_MS;
};

export const del = (key) => store.delete(key);

export const markAsStale = (key) => {
  const entry = store.get(key);
  if (entry) {
    entry.isStale = true;
  }
};

export const getWithFreshness = (key) => {
  const entry = store.get(key);
  if (!entry) return null;

  const isFresh = Date.now() <= entry.expiresAt;
  const age = Date.now() - entry.createdAt;
  const isExpired = age > STALE_DATA_MAX_AGE_MS;

  return {
    value: entry.value,
    isFresh,
    age,
    isExpired,
  };
};

export const clearAllStale = () => {
  const now = Date.now();
  let cleared = 0;
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(key);
      cleared++;
    }
  }
  return cleared;
};
