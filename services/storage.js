const PREFIX = 'bright-path:v1:';

export function readStore(key, fallback = []) {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStore(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
  return value;
}

export function scopedKey(userId, collection) {
  return `${collection}:${userId}`;
}

export function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
