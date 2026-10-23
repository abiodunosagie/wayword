import { assertEquals } from "@std/assert";
import type { Claude, Meter, StreamEvent } from "./claude.ts";
import { LIMITS } from "./config.ts";
import { type Claim, type Deps, handle } from "./handler.ts";

type Calls = { claims: number; logs: [number, number, number][]; claude: number };

function deps(overrides: Partial<Deps> = {}, claim: Claim = { request_id: 7, refusal: null }) {
  const calls: Calls = { claims: 0, logs: [], claude: 0 };
  const claude: Claude = {
    structured(_req, _signal, meter: Meter) {
      calls.claude++;
      meter.add({ input_tokens: 100, output_tokens: 50 });
      const words = Array.from({ length: 9 }, (_, i) => ({ word: `w${i}` }));
      return Promise.resolve({ fields: { readable: true, words }, stop_reason: "end_turn" });
    },
    async *stream(_req, _signal, meter: Meter): AsyncGenerator<StreamEvent> {
      calls.claude++;
      yield { type: "text", text: "Olá" };
      meter.add({ input_tokens: 10, output_tokens: 5 });
      yield { type: "done", stop_reason: "end_turn" };
    },
  };
  const d: Deps = {
    configured: true,
    claude,
    hashIp: () => Promise.resolve("ip"),
    userFor: (token) => Promise.resolve(token === "good" ? "user-1" : null),
    claim: () => {
      calls.claims++;
      return Promise.resolve(claim);
    },
    logUsage: (id, input, output) => {
      calls.logs.push([id, input, output]);
      return Promise.resolve();
    },
    ...overrides,
  };
  return { d, calls };
}

const base = { native: "en", target: "pt-PT", level: "beginner" };
const post = (body: unknown, token = "good") =>
  new Request("http://x/wayword", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const snap = { ...base, mode: "snap", image: { media_type: "image/jpeg", data: "QUJD" } };

Deno.test("no session, a bad session and a non-POST never reach Claude", async () => {
  const { d, calls } = deps();
  assertEquals((await handle(post(snap, "bad"), d)).status, 401);
  assertEquals((await handle(new Request("http://x", { method: "POST", body: "{}" }), d)).status, 401);
  assertEquals((await handle(new Request("http://x"), d)).status, 405);
  assertEquals(calls.claude + calls.claims, 0);
});

Deno.test("an invalid body is refused before a slot is claimed", async () => {
  const { d, calls } = deps();
  const res = await handle(post({ ...base, mode: "snap" }), d);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "image is missing.");
  assertEquals(calls.claims, 0);
});

Deno.test("an over-limit body is refused without reading it all", async () => {
  const { d, calls } = deps();
  const body = JSON.stringify({ ...snap, image: { media_type: "image/jpeg", data: "A".repeat(LIMITS.maxBodyBytes) } });
  const res = await handle(
    new Request("http://x", { method: "POST", headers: { Authorization: "Bearer good" }, body }),
    d,
  );
  assertEquals(res.status, 413);
  assertEquals(calls.claims, 0);
});

Deno.test("a refused slot returns the limit message and never calls Claude", async () => {
  const { d, calls } = deps({}, { request_id: null, refusal: "user_day" });
  const res = await handle(post(snap), d);
  assertEquals(res.status, 429);
  assertEquals((await res.json()).error, "You reached today's limit. Come back tomorrow.");
  assertEquals(calls.claude, 0);
});

Deno.test("a database failure fails closed", async () => {
  const { d, calls } = deps({ claim: () => Promise.reject(new Error("db down")) });
  const res = await handle(post(snap), d);
  assertEquals(res.status, 503);
  assertEquals(calls.claude, 0);
});

Deno.test("snap returns the fields, at most six words, and logs what it spent", async () => {
  const { d, calls } = deps();
  const res = await handle(post(snap), d);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.fields.words.length, 6);
  assertEquals(calls.logs, [[7, 100, 50]]);
});

Deno.test("explain streams text then done, and logs at the end", async () => {
  const { d, calls } = deps();
  const res = await handle(post({ ...base, mode: "explain", phrase: "farmácia" }), d);
  assertEquals(res.headers.get("Content-Type"), "text/event-stream");
  const text = await res.text();
  assertEquals(text, 'data: {"type":"text","text":"Olá"}\n\ndata: {"type":"done","stop_reason":"end_turn"}\n\n');
  assertEquals(calls.logs, [[7, 10, 5]]);
});

Deno.test("a failed Claude call still logs a cautious estimate and shows no internals", async () => {
  const { d, calls } = deps();
  d.claude.structured = () => Promise.reject(new Error("socket hang up at 10.0.0.1"));
  const res = await handle(post(snap), d);
  assertEquals(res.status, 502);
  assertEquals((await res.json()).error, "Something went wrong. Try again.");
  assertEquals(calls.logs.length, 1);
  assertEquals(calls.logs[0][2], 4000);
});

Deno.test("an unconfigured server says so", async () => {
  const { d } = deps({ configured: false });
  assertEquals((await handle(post(snap), d)).status, 503);
});
