import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import {
  DEFAULT_PROACTIVE_THRESHOLD,
  resolveProactiveCompactionThreshold,
} from "./proactive-compaction.js";

describe("resolveProactiveCompactionThreshold", () => {
  it("returns default threshold when no config provided", () => {
    expect(resolveProactiveCompactionThreshold()).toBe(DEFAULT_PROACTIVE_THRESHOLD);
    expect(resolveProactiveCompactionThreshold(undefined)).toBe(DEFAULT_PROACTIVE_THRESHOLD);
  });

  it("returns default threshold when compaction config is empty", () => {
    const cfg = { agents: { defaults: { compaction: {} } } } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(DEFAULT_PROACTIVE_THRESHOLD);
  });

  it("returns configured value within valid range", () => {
    const cfg = {
      agents: { defaults: { compaction: { proactiveThreshold: 0.8 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(0.8);
  });

  it("returns configured value at range boundaries", () => {
    const low = {
      agents: { defaults: { compaction: { proactiveThreshold: 0.5 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(low)).toBe(0.5);

    const high = {
      agents: { defaults: { compaction: { proactiveThreshold: 0.95 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(high)).toBe(0.95);
  });

  it("returns 0 when explicitly set to 0 (disabled)", () => {
    const cfg = {
      agents: { defaults: { compaction: { proactiveThreshold: 0 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(0);
  });

  it("returns default for values below valid range", () => {
    const cfg = {
      agents: { defaults: { compaction: { proactiveThreshold: 0.3 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(DEFAULT_PROACTIVE_THRESHOLD);
  });

  it("returns default for values above valid range", () => {
    const cfg = {
      agents: { defaults: { compaction: { proactiveThreshold: 0.99 } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(DEFAULT_PROACTIVE_THRESHOLD);
  });

  it("returns default for non-number values", () => {
    const cfg = {
      agents: { defaults: { compaction: { proactiveThreshold: "high" as unknown as number } } },
    } as OpenClawConfig;
    expect(resolveProactiveCompactionThreshold(cfg)).toBe(DEFAULT_PROACTIVE_THRESHOLD);
  });
});
