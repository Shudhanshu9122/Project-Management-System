/**
 * Remembers the last successful task list so the app can still show something
 * useful when the device is offline.
 *
 * In-memory only, and deliberately so: it survives navigation for the whole
 * session without adding a storage dependency. Turning it into a cache that
 * survives a cold start would mean writing to the filesystem, which is a
 * bigger decision than this feature needs.
 */
let cachedTasks = null;
let cachedAt = null;

export function rememberTasks(tasks) {
  cachedTasks = tasks;
  cachedAt = new Date();
}

export function readCachedTasks() {
  if (!cachedTasks) return null;
  return { tasks: cachedTasks, cachedAt };
}

export function clearTaskCache() {
  cachedTasks = null;
  cachedAt = null;
}
