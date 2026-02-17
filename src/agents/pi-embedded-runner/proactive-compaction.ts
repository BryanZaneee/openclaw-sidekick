import { SessionManager } from "@mariozechner/pi-coding-agent";
import type { OpenClawConfig } from "../../config/config.js";
import { estimateMessagesTokens } from "../compaction.js";

export const DEFAULT_PROACTIVE_THRESHOLD = 0.75;

export async function shouldRunProactiveCompaction(params: {
  sessionFile: string;
  contextWindowTokens: number;
  threshold: number;
}): Promise<boolean> {
  try {
    const session = SessionManager.open(params.sessionFile);
    const branch = session.getBranch();
    const messages = branch
      .filter((entry) => entry.type === "message")
      .map((entry) => entry.message);
    const estimatedTokens = estimateMessagesTokens(messages);
    return estimatedTokens > params.contextWindowTokens * params.threshold;
  } catch {
    return false;
  }
}

export function resolveProactiveCompactionThreshold(cfg?: OpenClawConfig): number {
  const value = cfg?.agents?.defaults?.compaction?.proactiveThreshold;
  if (value === 0) {
    return 0;
  }
  if (typeof value === "number" && value >= 0.5 && value <= 0.95) {
    return value;
  }
  return DEFAULT_PROACTIVE_THRESHOLD;
}
