import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ANetStdioTapDevState } from "@anet/shared";
import { getAppConfigDir } from "#src/paths.js";
import { isEffectiveDevelopmentNodeEnv } from "#src/runtime-tools/nodeEnv.js";

interface ANetStdioTapStateFile {
  enabled?: boolean;
}

export function isANetStdioTapDevVisible(): boolean {
  return isEffectiveDevelopmentNodeEnv();
}

export function getANetStdioTapDevDir(): string {
  return join(getAppConfigDir(), "dev");
}

export function getANetStdioTapDevLogDir(): string {
  return join(getANetStdioTapDevDir(), "stdio-traffic");
}

export function getANetStdioTapDevStatePath(): string {
  return join(getANetStdioTapDevDir(), "anet-stdio-tap.json");
}

function readStateFile(path: string): ANetStdioTapStateFile {
  if (!existsSync(path)) {
    return {};
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as ANetStdioTapStateFile) : {};
  } catch {
    return {};
  }
}

export function readANetStdioTapDevState(): ANetStdioTapDevState {
  const visible = isANetStdioTapDevVisible();
  const statePath = getANetStdioTapDevStatePath();
  const fileState = readStateFile(statePath);
  return {
    enabled: visible && fileState.enabled === true,
    visible,
    logDir: getANetStdioTapDevLogDir(),
    statePath,
  };
}

export function setANetStdioTapDevEnabled(enabled: boolean): ANetStdioTapDevState {
  const visible = isANetStdioTapDevVisible();
  const statePath = getANetStdioTapDevStatePath();
  mkdirSync(getANetStdioTapDevDir(), { recursive: true });
  writeFileSync(
    statePath,
    `${JSON.stringify(
      {
        // 开发态 stdio 抓包是高频原始协议帧，只能通过显式开关写旁路文件，避免误进生产日志。
        enabled: visible && enabled,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
  return readANetStdioTapDevState();
}
