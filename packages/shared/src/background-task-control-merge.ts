import type { ANetBackgroundTaskControlItem } from "./background-task-controls.js";

export function mergeANetBackgroundTaskControlItems(
  current: readonly ANetBackgroundTaskControlItem[],
  updates: readonly ANetBackgroundTaskControlItem[],
): ANetBackgroundTaskControlItem[] {
  const jobsById = new Map(current.map((job) => [job.jobId, job] as const));
  for (const job of updates) {
    jobsById.set(job.jobId, job);
  }
  return Array.from(jobsById.values());
}
