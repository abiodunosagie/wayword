// The JSON shapes Claude must answer in (structured output). The app reads exactly these fields.

const WORD = {
  type: "object",
  properties: {
    word: { type: "string", description: "The word or short phrase as written, in the target language" },
    meaning: { type: "string", description: "What it means, in the learner's language, a few words" },
    part_of_speech: {
      type: "string",
      enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"],
    },
    pronunciation: {
      type: "string",
      description: "How to say it, spelled for a speaker of the learner's language, syllables split by hyphens",
    },
    example: { type: "string", description: "One short everyday sentence using it, in the target language" },
    example_meaning: { type: "string", description: "That sentence in the learner's language" },
    note: {
      type: "string",
      description: "One sentence on what is worth knowing (gender, formality, a false friend), or empty",
    },
  },
  required: ["word", "meaning", "part_of_speech", "pronunciation", "example", "example_meaning", "note"],
  additionalProperties: false,
} as const;

export const SNAP_SCHEMA = {
  type: "object",
  properties: {
    readable: {
      type: "boolean",
      description: "False when the photo has no text in the target language that can be read",
    },
    kind: { type: "string", enum: ["sign", "menu", "letter", "label", "screen", "note", "other"] },
    title: {
      type: "string",
      description: "A short name for this photo in the learner's language, like 'Pharmacy opening hours'",
    },
    source_text: { type: "string", description: "The text in the photo, copied exactly, line breaks kept" },
    translation: { type: "string", description: "The whole text in the learner's language" },
    explanation: {
      type: "string",
      description: "Two to four sentences in the learner's language on what this says and what to do about it",
    },
    words: { type: "array", items: WORD, description: "Three to six words or phrases from the text worth learning" },
  },
  required: ["readable", "kind", "title", "source_text", "translation", "explanation", "words"],
  additionalProperties: false,
} as const;

export const TALK_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "What the other person says next, in the target language" },
    reply_meaning: { type: "string", description: "That reply in the learner's language" },
    correction: {
      type: "object",
      description: "Feedback on the learner's last message; empty strings when it was already right or there is none",
      properties: {
        corrected: { type: "string", description: "The learner's last message said correctly and naturally, or empty" },
        why: { type: "string", description: "One short sentence in the learner's language on what changed, or empty" },
      },
      required: ["corrected", "why"],
      additionalProperties: false,
    },
    words: {
      type: "array",
      description: "Up to three useful new words from the reply",
      items: {
        type: "object",
        properties: { word: { type: "string" }, meaning: { type: "string" } },
        required: ["word", "meaning"],
        additionalProperties: false,
      },
    },
    finished: { type: "boolean", description: "True when the situation has reached a natural end" },
  },
  required: ["reply", "reply_meaning", "correction", "words", "finished"],
  additionalProperties: false,
} as const;

export const STORY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The story's title in the target language" },
    title_meaning: { type: "string", description: "The title in the learner's language" },
    paragraphs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "One paragraph in the target language" },
          meaning: { type: "string", description: "The same paragraph in the learner's language" },
        },
        required: ["text", "meaning"],
        additionalProperties: false,
      },
    },
    used: {
      type: "array",
      items: { type: "string" },
      description: "Which of the given words the story uses, as given",
    },
  },
  required: ["title", "title_meaning", "paragraphs", "used"],
  additionalProperties: false,
} as const;
