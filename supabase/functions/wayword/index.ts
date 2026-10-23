// Wayword's one Claude endpoint: POST /functions/v1/wayword. This file only wires the real
// database, auth and Anthropic client into handler.ts. The Anthropic key exists only as a
// Supabase secret; the app never sees it.
import { createClient } from "@supabase/supabase-js";
import { anthropicClaude } from "./claude.ts";
import { LIMITS } from "./config.ts";
import { type Claim, handle } from "./handler.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);
const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

// The network a request came from, hashed so no raw IP address is ever stored. Supabase's edge
// sits behind Cloudflare, which sets CF-Connecting-IP itself and rejects requests that send their
// own, so it cannot be faked the way X-Forwarded-For can. Without it the request shares one
// "unknown" bucket, so a missing header limits harder instead of not at all.
async function hashIp(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  if (!ip) console.warn("request without CF-Connecting-IP; using the shared unknown bucket");
  const salted = new TextEncoder().encode(`${Deno.env.get("SUPABASE_URL")}|${ip || "unknown"}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", salted));
  return Array.from(digest.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve((request) =>
  handle(request, {
    configured: apiKey !== "",
    claude: anthropicClaude(apiKey),
    hashIp,
    async userFor(token) {
      const { data, error } = await admin.auth.getUser(token);
      return error || !data.user ? null : data.user.id;
    },
    async claim(userId, ipHash, mode, model) {
      const { data, error } = await admin.rpc("claim_wayword_request", {
        p_user: userId,
        p_ip_hash: ipHash,
        p_mode: mode,
        p_model: model,
        p_user_per_minute: LIMITS.perUserPerMinute,
        p_user_per_day: LIMITS.perUserPerDay,
        p_ip_per_day: LIMITS.perIpPerDay,
        p_project_per_day: LIMITS.projectPerDay,
        p_user_tokens_per_day: LIMITS.userTokensPerDay,
        p_project_tokens_per_day: LIMITS.projectTokensPerDay,
      });
      if (error) throw new Error(error.message);
      return (data as Claim[] | null)?.[0] ?? { request_id: null, refusal: "project_day" };
    },
    async logUsage(requestId, input, output) {
      const { error } = await admin
        .from("wayword_requests")
        .update({ input_tokens: input, output_tokens: output })
        .eq("id", requestId);
      if (error) throw new Error(error.message);
    },
  })
);
