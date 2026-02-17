import { describe, expect, it } from "vitest";
import { buildEnrichedDescription } from "./workspace.js";

describe("buildEnrichedDescription", () => {
  it("appends use-when hints to description", () => {
    const result = buildEnrichedDescription("A cool skill.", {
      useWhen: ["user asks about X"],
    });
    expect(result).toBe("A cool skill.\nUse when: user asks about X");
  });

  it("appends dont-use-when hints to description", () => {
    const result = buildEnrichedDescription("A cool skill.", {
      dontUseWhen: ["user wants Y"],
    });
    expect(result).toBe("A cool skill.\nDon't use when: user wants Y");
  });

  it("appends both hints to description", () => {
    const result = buildEnrichedDescription("A cool skill.", {
      useWhen: ["working with repos", "PRs"],
      dontUseWhen: ["local git operations"],
    });
    expect(result).toBe(
      "A cool skill.\nUse when: working with repos; PRs\nDon't use when: local git operations",
    );
  });

  it("handles undefined description", () => {
    const result = buildEnrichedDescription(undefined, {
      useWhen: ["always"],
    });
    expect(result).toBe("Use when: always");
  });

  it("handles empty routing arrays", () => {
    const result = buildEnrichedDescription("desc", {});
    expect(result).toBe("desc");
  });

  it("joins multiple conditions with semicolons", () => {
    const result = buildEnrichedDescription("desc", {
      useWhen: ["cond A", "cond B", "cond C"],
    });
    expect(result).toBe("desc\nUse when: cond A; cond B; cond C");
  });
});
