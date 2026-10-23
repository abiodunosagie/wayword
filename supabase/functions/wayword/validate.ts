// Checks every request body before anything is spent. The app sends typed fields, never raw
// Claude messages, so the server builds every prompt itself and a modified app can only change
// the words inside the fields, each one capped in length.
import { LIMITS, type Mode, MODES } from "./config.ts";
import { LANGUAGES, type Level, LEVELS } from "./languages.ts";

type Common = { native: string; target: string; level: Level };

export type SnapRequest = Common & {
  mode: "snap";
  image: { media_type: "image/jpeg" | "image/png" | "image/webp"; data: string };
};
export type ExplainRequest = Common & { mode: "explain"; phrase: string; context: string; question: string };
export type Turn = { role: "user" | "assistant"; text: string };
export type TalkRequest = Common & {
  mode: "talk";
  scenario: { title: string; setting: string };
  turns: Turn[];
};
export type StoryWord = { word: string; meaning: string };
export type StoryRequest = Common & { mode: "story"; words: StoryWord[] };

export type WaywordRequest = SnapRequest | ExplainRequest | TalkRequest | StoryRequest;

export type Checked = { ok: true; value: WaywordRequest } | { ok: false; error: string };

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

class Invalid extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** A trimmed string of at most [max] characters; empty only when [optional]. */
function text(v: unknown, field: string, max: number, optional = false): string {
  if (v === undefined && optional) return "";
  if (typeof v !== "string") throw new Invalid(`${field} must be text.`);
  const value = v.trim();
  if (!value && !optional) throw new Invalid(`${field} is empty.`);
  if (value.length > max) throw new Invalid(`${field} is too long.`);
  return value;
}

function common(body: Record<string, unknown>): Common {
  const native = body.native;
  const target = body.target;
  if (typeof native !== "string" || !(native in LANGUAGES)) throw new Invalid("Unknown native language.");
  if (typeof target !== "string" || !(target in LANGUAGES)) throw new Invalid("Unknown target language.");
  if (native === target) throw new Invalid("Pick two different languages.");
  const level = body.level;
  if (typeof level !== "string" || !(level in LEVELS)) throw new Invalid("Unknown level.");
  return { native, target, level: level as Level };
}

function snap(body: Record<string, unknown>, base: Common): SnapRequest {
  const image = body.image;
  if (!isObject(image)) throw new Invalid("image is missing.");
  const mediaType = image.media_type;
  if (typeof mediaType !== "string" || !MEDIA_TYPES.includes(mediaType)) {
    throw new Invalid("Use a JPEG, PNG or WebP photo.");
  }
  const data = image.data;
  if (typeof data !== "string" || !data) throw new Invalid("image has no data.");
  if (data.length > LIMITS.maxImageBase64Chars) throw new Invalid("That photo is too large.");
  if (!BASE64.test(data)) throw new Invalid("image data must be base64.");
  return { ...base, mode: "snap", image: { media_type: mediaType as SnapRequest["image"]["media_type"], data } };
}

function explain(body: Record<string, unknown>, base: Common): ExplainRequest {
  return {
    ...base,
    mode: "explain",
    phrase: text(body.phrase, "phrase", LIMITS.maxPhraseChars),
    context: text(body.context, "context", LIMITS.maxContextChars, true),
    question: text(body.question, "question", LIMITS.maxQuestionChars, true),
  };
}

function talk(body: Record<string, unknown>, base: Common): TalkRequest {
  const scenario = body.scenario;
  if (!isObject(scenario)) throw new Invalid("scenario is missing.");
  const turns = body.turns;
  if (!Array.isArray(turns)) throw new Invalid("turns must be a list.");
  if (turns.length > LIMITS.maxTalkTurns) throw new Invalid("This conversation is too long. Start a new one.");
  // Claude opens the scene, so turns alternate assistant, user, assistant... and a request always
  // ends on the user's turn (or is empty, to get the opening line).
  const checked = turns.map((turn, i): Turn => {
    if (!isObject(turn)) throw new Invalid("Each turn must be an object.");
    const role = i % 2 === 0 ? "assistant" : "user";
    if (turn.role !== role) throw new Invalid("Turns must take turns, starting with the other person.");
    return { role, text: text(turn.text, "turn", LIMITS.maxTurnChars) };
  });
  if (checked.length > 0 && checked[checked.length - 1].role !== "user") throw new Invalid("It is your turn to speak.");
  return {
    ...base,
    mode: "talk",
    scenario: {
      title: text(scenario.title, "scenario title", 120),
      setting: text(scenario.setting, "scenario setting", LIMITS.maxContextChars, true),
    },
    turns: checked,
  };
}

function story(body: Record<string, unknown>, base: Common): StoryRequest {
  const words = body.words;
  if (!Array.isArray(words) || words.length === 0) throw new Invalid("Keep a few words first.");
  if (words.length > LIMITS.maxStoryWords) throw new Invalid("Too many words for one story.");
  return {
    ...base,
    mode: "story",
    words: words.map((w) => {
      if (!isObject(w)) throw new Invalid("Each word must be an object.");
      return {
        word: text(w.word, "word", LIMITS.maxWordChars),
        meaning: text(w.meaning, "meaning", LIMITS.maxWordChars, true),
      };
    }),
  };
}

export function validateRequest(body: unknown): Checked {
  try {
    if (!isObject(body)) throw new Invalid("Body must be a JSON object.");
    const mode = body.mode;
    if (typeof mode !== "string" || !(MODES as readonly string[]).includes(mode)) throw new Invalid("Unknown mode.");
    const base = common(body);
    switch (mode as Mode) {
      case "snap":
        return { ok: true, value: snap(body, base) };
      case "explain":
        return { ok: true, value: explain(body, base) };
      case "talk":
        return { ok: true, value: talk(body, base) };
      case "story":
        return { ok: true, value: story(body, base) };
    }
  } catch (error) {
    if (error instanceof Invalid) return { ok: false, error: error.message };
    throw error;
  }
  return { ok: false, error: "Unknown mode." };
}
