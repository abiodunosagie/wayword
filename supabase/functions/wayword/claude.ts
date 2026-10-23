// The only file that talks to the Anthropic API. Why? streams back as it is written; Snap, Talk
// and the story return one finished JSON answer in the shape schemas.ts sets.
import Anthropic from "@anthropic-ai/sdk";
import { EFFORT, MAX_TOKENS, MODEL, SERVER_FALLBACK_BETA } from "./config.ts";
import { promptFor } from "./prompts.ts";
import { SNAP_SCHEMA, STORY_SCHEMA, TALK_SCHEMA } from "./schemas.ts";
import type { WaywordRequest } from "./validate.ts";

/**
 * What one request has spent, filled in as the API reports it. The handler logs it even when the
 * app disconnects or the call fails, so an aborted request still counts against the limits.
 * `input` stays null until the API has reported any input.
 */
export class Meter {
  input: number | null = null;
  output = 0;

  add(usage: { input_tokens: number; output_tokens: number }) {
    this.input = (this.input ?? 0) + usage.input_tokens;
    this.output += usage.output_tokens;
  }
}

export type StructuredResult = { fields: Record<string, unknown> | null; stop_reason: string | null };
export type StreamEvent = { type: "text"; text: string } | { type: "done"; stop_reason: string | null };

/** What the handler needs from Claude; tests pass a fake. */
export interface Claude {
  structured(req: WaywordRequest, signal: AbortSignal, meter: Meter): Promise<StructuredResult>;
  stream(req: WaywordRequest, signal: AbortSignal, meter: Meter): AsyncGenerator<StreamEvent>;
}

const SCHEMAS = { snap: SNAP_SCHEMA, talk: TALK_SCHEMA, story: STORY_SCHEMA } as const;

function params(req: WaywordRequest) {
  const { system, messages } = promptFor(req);
  return {
    model: MODEL,
    max_tokens: MAX_TOKENS[req.mode],
    system,
    messages: messages as Anthropic.Beta.BetaMessageParam[],
    betas: [SERVER_FALLBACK_BETA],
    fallbacks: "default" as const,
  };
}

export function anthropicClaude(apiKey: string): Claude {
  const anthropic = new Anthropic({ apiKey });
  return {
    async structured(req, signal, meter) {
      if (req.mode === "explain") throw new Error("explain streams");
      const response = await anthropic.beta.messages.create(
        {
          ...params(req),
          output_config: { effort: EFFORT[req.mode], format: { type: "json_schema", schema: SCHEMAS[req.mode] } },
        },
        { signal },
      );
      meter.add(response.usage);
      const text = response.content.find((b) => b.type === "text");
      if (response.stop_reason !== "end_turn" || text?.type !== "text") {
        return { fields: null, stop_reason: response.stop_reason };
      }
      try {
        return { fields: JSON.parse(text.text), stop_reason: response.stop_reason };
      } catch {
        // Structured output should never produce bad JSON; treat it like a reply with no fields.
        return { fields: null, stop_reason: response.stop_reason };
      }
    },

    async *stream(req, signal, meter) {
      const stream = anthropic.beta.messages.stream(
        { ...params(req), output_config: { effort: EFFORT[req.mode] } },
        { signal },
      );
      // Output is only reported at the end; until then it is estimated from what streamed (about
      // three characters per token), so an abandoned reply still costs something.
      let streamed = 0;
      for await (const event of stream) {
        if (event.type === "message_start") {
          meter.input = event.message.usage.input_tokens;
        } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          streamed += event.delta.text.length;
          meter.output = Math.ceil(streamed / 3);
          yield { type: "text", text: event.delta.text };
        }
      }
      const final = await stream.finalMessage();
      meter.input = null;
      meter.output = 0;
      meter.add(final.usage);
      yield { type: "done", stop_reason: final.stop_reason };
    },
  };
}

// The app shows these words as they are, so they never carry internal details.
export function publicError(error: unknown): { message: string; status: number } {
  if (error instanceof Anthropic.RateLimitError) {
    return { message: "Claude is busy right now. Try again in a moment.", status: 503 };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { message: "Claude could not take that request.", status: 400 };
  }
  if (error instanceof Anthropic.AuthenticationError) return { message: "The server is not set up yet.", status: 503 };
  if (error instanceof Anthropic.APIConnectionError) {
    return { message: "Could not reach Claude. Try again.", status: 502 };
  }
  return { message: "Something went wrong. Try again.", status: 502 };
}
