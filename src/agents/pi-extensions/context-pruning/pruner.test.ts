import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { describe, expect, it } from "vitest";
import { pruneContextMessages } from "./pruner.js";
import { DEFAULT_CONTEXT_PRUNING_SETTINGS } from "./settings.js";

function toolText(msg: AgentMessage): string {
  if (msg.role !== "toolResult") {
    throw new Error("expected toolResult");
  }
  const first = msg.content.find((b) => b.type === "text");
  if (!first || first.type !== "text") {
    return "";
  }
  return first.text;
}

function findToolResult(messages: AgentMessage[], toolCallId: string): AgentMessage {
  const msg = messages.find((m) => m.role === "toolResult" && m.toolCallId === toolCallId);
  if (!msg) {
    throw new Error(`missing toolResult: ${toolCallId}`);
  }
  return msg;
}

function makeToolResult(params: {
  toolCallId: string;
  toolName: string;
  text: string;
}): AgentMessage {
  return {
    role: "toolResult",
    toolCallId: params.toolCallId,
    toolName: params.toolName,
    content: [{ type: "text", text: params.text }],
    isError: false,
    timestamp: Date.now(),
  };
}

function makeAssistant(text: string): AgentMessage {
  return {
    role: "assistant",
    content: [{ type: "text", text }],
    api: "openai-responses",
    provider: "openai",
    model: "fake",
    usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, total: 2 },
    stopReason: "stop",
    timestamp: Date.now(),
  };
}

function makeUser(text: string): AgentMessage {
  return { role: "user", content: text, timestamp: Date.now() };
}

describe("pruner visibility", () => {
  it("hard-clear placeholder includes tool name", () => {
    const messages: AgentMessage[] = [
      makeUser("u1"),
      makeAssistant("a1"),
      makeToolResult({
        toolCallId: "t1",
        toolName: "read_file",
        text: "x".repeat(20_000),
      }),
      makeAssistant("a2"),
    ];

    const settings = {
      ...DEFAULT_CONTEXT_PRUNING_SETTINGS,
      keepLastAssistants: 0,
      softTrimRatio: 0,
      hardClearRatio: 0,
      minPrunableToolChars: 0,
      hardClear: { enabled: true, placeholder: "content cleared" },
      softTrim: { maxChars: 10, headChars: 3, tailChars: 3 },
    };

    const next = pruneContextMessages({
      messages,
      settings,
      ctx: { model: { contextWindow: 1000 } } as unknown as ExtensionContext,
    });

    const text = toolText(findToolResult(next, "t1"));
    expect(text).toBe("[read_file: content cleared]");
  });

  it("soft-trim note includes tool name", () => {
    const messages: AgentMessage[] = [
      makeUser("u1"),
      makeToolResult({
        toolCallId: "t1",
        toolName: "grep_search",
        text: "abcdefghij".repeat(1000),
      }),
    ];

    const settings = {
      ...DEFAULT_CONTEXT_PRUNING_SETTINGS,
      keepLastAssistants: 0,
      softTrimRatio: 0.0,
      hardClearRatio: 10.0,
      minPrunableToolChars: 0,
      softTrim: { maxChars: 10, headChars: 6, tailChars: 6 },
    };

    const next = pruneContextMessages({
      messages,
      settings,
      ctx: { model: { contextWindow: 1000 } } as unknown as ExtensionContext,
    });

    const text = toolText(findToolResult(next, "t1"));
    expect(text).toContain("[grep_search result trimmed:");
    expect(text).toContain("kept first 6 chars and last 6 chars of 10000 chars.]");
  });

  it("default placeholder text is actionable", () => {
    expect(DEFAULT_CONTEXT_PRUNING_SETTINGS.hardClear.placeholder).toBe(
      "[Tool result cleared. Use memory_search to recall earlier findings or re-run the tool.]",
    );
  });

  it("hard-clear uses default actionable placeholder with tool name", () => {
    const messages: AgentMessage[] = [
      makeUser("u1"),
      makeAssistant("a1"),
      makeToolResult({
        toolCallId: "t1",
        toolName: "exec_command",
        text: "x".repeat(20_000),
      }),
      makeAssistant("a2"),
    ];

    const settings = {
      ...DEFAULT_CONTEXT_PRUNING_SETTINGS,
      keepLastAssistants: 0,
      softTrimRatio: 0,
      hardClearRatio: 0,
      minPrunableToolChars: 0,
    };

    const next = pruneContextMessages({
      messages,
      settings,
      ctx: { model: { contextWindow: 1000 } } as unknown as ExtensionContext,
    });

    const text = toolText(findToolResult(next, "t1"));
    expect(text).toContain("exec_command:");
    expect(text).toContain("memory_search");
  });
});
