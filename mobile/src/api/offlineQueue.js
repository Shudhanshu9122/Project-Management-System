import { api } from './client';

let queue = [];
let replaying = false;

export function enqueueEdit(taskId, changes) {
  queue.push({ taskId, changes });
}

export async function replayQueue() {
  if (replaying || queue.length === 0) return;
  replaying = true;

  const currentQueue = [...queue];
  queue = [];

  for (const { taskId, changes } of currentQueue) {
    try {
      await api.put(\/tasks/\\, changes);
    } catch (e) {
      if (e.isOffline || e.name === 'ApiError') {
        // Keep in queue if offline
        if (e.isOffline) queue.push({ taskId, changes });
      }
    }
  }

  replaying = false;
  return currentQueue.length > 0; // return true if we replayed something
}

