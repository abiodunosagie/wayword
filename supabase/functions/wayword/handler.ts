// What POST /functions/v1/wayword does, with everything it talks to passed in, so the tests run it
// against fakes. Order of checks: body size, signed-in user, valid body, rate limits, then Claude.
// Whatever the call spends is logged at the end, even when the app disconnects.
import { type Claude, Meter, publicError } from "./claude.ts";
import { LIMITS, MAX_TOKENS, MODEL } from "./config.ts";
import { validateRequest, type WaywordRequest } from "./validate.ts";

export type Claim = { request_id: number | null; refusal: string | null };

export interface Deps {
  /** The signed-in user's id for this access token, or null. */
  userFor(token: string): Promise<string | null>;
  /** Checks every limit and records the request in one locked step. Throws when the database fails. */
  claim(userId: string, ipHash: string, mode: string, model: string): Promise<Claim>;
  logUsage(requestId: number, input: number, output: number): Promise<void>;
  claude: Claude;
  hashIp(request: Request): Promise<string>;
  configured: boolean;
}

// The mobile app needs no CORS. These headers stay so an Expo web build can call the function;
// auth is a Bearer header, never a cookie, so * is safe.
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REFUSALS: Record<string, string> = {
  user_minute: "Slow down a little. Try again in a minute.",
  user_day: "You reached today's limit. Come back tomorrow.",
  user_tokens: "You reached today's limit. Come back tomorrow.",
  ip_day: "This network reached today's limit. Try again tomorrow.",
  project_day: "Wayword reached its daily limit. Try again tomorrow.",
};

// How many items of each list the app shows; anything beyond is dropped here.
const MAX_SNAP_WORDS = 6;
const MAX_TALK_WORDS = 3;

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const decoder = new TextDecoder();

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  try {
    if (!deps.configured) throw new HttpError(503, "The server is not set up yet.");
    const size = Number(request.headers.get("Content-Length") ?? "0");
    if (size > LIMITS.maxBodyBytes) throw new HttpError(413, "That request is too large.");

    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "Sign in first.");
    const userId = await deps.userFor(token);
    if (!userId) throw new HttpError(401, "Your session ended. Sign in again.");

    const req = await readBody(request);
    const requestId = await claimSlot(deps, userId, await deps.hashIp(request), req);

    // Stop the Claude call (and its billing) the moment the app goes away.
    const abort = new AbortController();
    request.signal.addEventListener("abort", () => abort.abort());
    const meter = new Meter();

    if (req.mode === "explain") return streamResponse(deps, req, abort, requestId, meter);
    try {
      const result = await deps.claude.structured(req, abort.signal, meter);
      return json(trimmed(req, result.fields, result.stop_reason));
    } finally {
      await log(deps, requestId, meter, req);
    }
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error("wayword request failed", error);
    const { message, status } = publicError(error);
    return json({ error: message }, status);
  }
}

async function readBody(request: Request): Promise<WaywordRequest> {
  let body: unknown;
  try {
    body = JSON.parse(await readLimited(request, LIMITS.maxBodyBytes));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Body must be JSON.");
  }
  const checked = validateRequest(body);
  if (!checked.ok) throw new HttpError(400, checked.error);
  return checked.value;
}

// Reads the body while counting bytes, so a request without (or lying about) Content-Length still
// cannot be larger than the limit.
async function readLimited(request: Request, max: number): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "That request is too large.");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return decoder.decode(all);
}

// Fails closed: no slot, no Claude call.
async function claimSlot(deps: Deps, userId: string, ip: string, req: WaywordRequest): Promise<number> {
  let row: Claim;
  try {
    row = await deps.claim(userId, ip, req.mode, MODEL);
  } catch (error) {
    console.error("rate limit check failed", error);
    throw new HttpError(503, "Wayword is busy. Try again in a moment.");
  }
  if (!row.request_id) throw new HttpError(429, REFUSALS[row.refusal ?? ""] ?? REFUSALS.project_day);
  return row.request_id;
}

function trimmed(req: WaywordRequest, fields: Record<string, unknown> | null, stop: string | null) {
  if (fields && req.mode === "snap" && Array.isArray(fields.words)) {
    fields.words = fields.words.slice(0, MAX_SNAP_WORDS);
  }
  if (fields && req.mode === "talk" && Array.isArray(fields.words)) {
    fields.words = fields.words.slice(0, MAX_TALK_WORDS);
  }
  return { fields, stop_reason: stop };
}

function streamResponse(deps: Deps, req: WaywordRequest, abort: AbortController, requestId: number, meter: Meter) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of deps.claude.stream(req, abort.signal, meter)) send(event);
      } catch (error) {
        if (abort.signal.aborted) return; // The app left; the stream is already closed.
        console.error("wayword stream failed", error);
        send({ type: "error", message: publicError(error).message });
      } finally {
        await log(deps, requestId, meter, req);
      }
      controller.close();
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(body, {
    headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

// When the API never reported a figure (the call failed or the app left early), a cautious
// estimate stands in, so aborting a request never makes it free.
async function log(deps: Deps, requestId: number, meter: Meter, req: WaywordRequest) {
  try {
    await deps.logUsage(
      requestId,
      meter.input ?? estimateInput(req),
      meter.input === null ? MAX_TOKENS[req.mode] : meter.output,
    );
  } catch (error) {
    console.error("usage update failed", error);
  }
}

// About four characters per token for text, and ~1,600 tokens for a phone photo at 1568 px.
function estimateInput(req: WaywordRequest): number {
  if (req.mode === "snap") return 1600 + 500;
  return Math.ceil(JSON.stringify(req).length / 4) + 500;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
