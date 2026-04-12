/**
 * Simple in-memory cache with TTL support.
 * Acts as a fallback store when downstream services are unavailable.
 */

const store = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const set = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
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

export const del = (key) => store.delete(key);
