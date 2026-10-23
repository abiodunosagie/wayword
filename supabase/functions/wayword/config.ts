// Every limit and model choice the function enforces lives here, so the app can never ask for more
// than the server allows. Change a number, redeploy, and every client follows.

export const MODES = ["snap", "explain", "talk", "story"] as const;
export type Mode = (typeof MODES)[number];

// One model for every mode: the app has no model picker, so cost is decided here. Sonnet reads
// handwriting and signs well and writes natural dialogue.
export const MODEL = "claude-sonnet-5-5";

// Sonnet supports server-side refusal fallbacks: a request its safety classifiers decline is
// re-run inside the same call instead of failing.
export const SERVER_FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Output ceilings per mode. Thinking counts toward these.
export const MAX_TOKENS: Record<Mode, number> = {
  snap: 4000,
  explain: 2000,
  talk: 2000,
  story: 4000,
};

// Reading a photo is the hard part; explaining, talking and writing a short story are routine.
export const EFFORT: Record<Mode, "low" | "medium"> = {
  snap: "medium",
  explain: "low",
  talk: "low",
  story: "low",
};

export const LIMITS = {
  perUserPerMinute: 15,
  perUserPerDay: 150,
  // Anyone can create an account, so one network (hashed IP) has its own ceiling, and the whole
  // project has a final one.
  perIpPerDay: 300,
  projectPerDay: 1500,
  userTokensPerDay: 120_000,
  // About $15 a day at worst, all on Sonnet.
  projectTokensPerDay: 1_000_000,
  // Base64 characters for one photo, about 2.6 MB. The app resizes to 1568 px JPEG first, which
  // is usually well under 1 MB.
  maxImageBase64Chars: 3_500_000,
  // The text Claude read from a photo, sent back as context for Why? and Talk.
  maxContextChars: 3_000,
  maxPhraseChars: 300,
  maxQuestionChars: 500,
  maxTalkTurns: 40,
  maxTurnChars: 1_000,
  maxStoryWords: 30,
  maxWordChars: 120,
  // Checked from Content-Length before the body is parsed, and again while it is read.
  maxBodyBytes: 4_000_000,
};
