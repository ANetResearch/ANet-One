import {
  collectVisibleANetBackgroundTaskControlItems,
  getANetBackgroundTaskControlItemElapsedMs,
  isActiveANetBackgroundTaskControlItem,
  parseANetBackgroundTaskControlItems,
  type ANetBackgroundTaskControlItem,
  type ANetBackgroundTaskControlStatus,
} from "./background-task-controls.js";

export type ANetBackgroundBashJobStatus = ANetBackgroundTaskControlStatus;
export type ANetBackgroundBashJob = ANetBackgroundTaskControlItem & {
  taskKind: "bash";
};

export function parseANetBackgroundBashJobs(value: unknown): ANetBackgroundBashJob[] {
  return parseANetBackgroundTaskControlItems(value).filter(isBackgroundBashJob);
}

export function isActiveANetBackgroundBashJob(job: ANetBackgroundBashJob): boolean {
  return isActiveANetBackgroundTaskControlItem(job);
}

export function getANetBackgroundBashJobElapsedMs(
  job: ANetBackgroundBashJob,
  now = Date.now(),
): number {
  return getANetBackgroundTaskControlItemElapsedMs(job, now);
}

export function collectVisibleANetBackgroundBashJobs(
  jobs: readonly ANetBackgroundBashJob[],
  now = Date.now(),
  thresholdMs = 30_000,
): Array<ANetBackgroundBashJob & { elapsedMs: number }> {
  return collectVisibleANetBackgroundTaskControlItems(jobs, now, thresholdMs) as Array<
    ANetBackgroundBashJob & { elapsedMs: number }
  >;
}

function isBackgroundBashJob(job: ANetBackgroundTaskControlItem): job is ANetBackgroundBashJob {
  return job.taskKind === "bash";
}
