import { describe, expect, it } from "vitest";
import { resolveSkillInvocationPolicy, resolveSkillRouting } from "./frontmatter.js";

describe("resolveSkillInvocationPolicy", () => {
  it("defaults to enabled behaviors", () => {
    const policy = resolveSkillInvocationPolicy({});
    expect(policy.userInvocable).toBe(true);
    expect(policy.disableModelInvocation).toBe(false);
  });

  it("parses frontmatter boolean strings", () => {
    const policy = resolveSkillInvocationPolicy({
      "user-invocable": "no",
      "disable-model-invocation": "yes",
    });
    expect(policy.userInvocable).toBe(false);
    expect(policy.disableModelInvocation).toBe(true);
  });
});

describe("resolveSkillRouting", () => {
  it("returns undefined when neither field is present", () => {
    expect(resolveSkillRouting({})).toBeUndefined();
  });

  it("returns undefined for empty frontmatter", () => {
    expect(resolveSkillRouting({ name: "test", description: "a skill" })).toBeUndefined();
  });

  it("parses both use-when and dont-use-when fields", () => {
    const routing = resolveSkillRouting({
      "use-when": "working with GitHub repos, PRs, issues",
      "dont-use-when": "local git operations",
    });
    expect(routing).toEqual({
      useWhen: ["working with GitHub repos", "PRs", "issues"],
      dontUseWhen: ["local git operations"],
    });
  });

  it("parses only use-when when dont-use-when is absent", () => {
    const routing = resolveSkillRouting({
      "use-when": "weather forecasts, current conditions",
    });
    expect(routing).toEqual({
      useWhen: ["weather forecasts", "current conditions"],
    });
  });

  it("parses only dont-use-when when use-when is absent", () => {
    const routing = resolveSkillRouting({
      "dont-use-when": "metaphorical usage",
    });
    expect(routing).toEqual({
      dontUseWhen: ["metaphorical usage"],
    });
  });

  it("handles JSON array values", () => {
    const routing = resolveSkillRouting({
      "use-when": '["condition A","condition B"]',
      "dont-use-when": '["not this","not that"]',
    });
    expect(routing).toEqual({
      useWhen: ["condition A", "condition B"],
      dontUseWhen: ["not this", "not that"],
    });
  });

  it("handles comma-separated strings", () => {
    const routing = resolveSkillRouting({
      "use-when": "foo, bar, baz",
    });
    expect(routing).toEqual({
      useWhen: ["foo", "bar", "baz"],
    });
  });

  it("trims whitespace from values", () => {
    const routing = resolveSkillRouting({
      "use-when": "  spaced out  ,  extra spaces  ",
    });
    expect(routing).toEqual({
      useWhen: ["spaced out", "extra spaces"],
    });
  });

  it("filters out empty entries", () => {
    const routing = resolveSkillRouting({
      "use-when": "valid, , ,also valid",
    });
    expect(routing).toEqual({
      useWhen: ["valid", "also valid"],
    });
  });
});
