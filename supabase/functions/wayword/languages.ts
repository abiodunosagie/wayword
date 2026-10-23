// The languages Wayword offers, by code. The app sends codes only; the server turns them into the
// names Claude sees, so nothing free-form about the language reaches the prompt.
export const LANGUAGES: Record<string, string> = {
  ar: "Arabic",
  "zh-Hans": "Chinese (Simplified)",
  cs: "Czech",
  da: "Danish",
  nl: "Dutch",
  en: "English",
  fi: "Finnish",
  fr: "French",
  de: "German",
  el: "Greek",
  ha: "Hausa",
  he: "Hebrew",
  hi: "Hindi",
  hu: "Hungarian",
  ig: "Igbo",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  nb: "Norwegian",
  pl: "Polish",
  "pt-BR": "Portuguese (Brazil)",
  "pt-PT": "Portuguese (Portugal)",
  ro: "Romanian",
  ru: "Russian",
  es: "Spanish",
  sw: "Swahili",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  yo: "Yoruba",
};

export const LEVELS = {
  beginner: "a beginner who knows only a few words",
  intermediate: "an intermediate learner who can handle simple everyday sentences",
  advanced: "an advanced learner who wants natural, idiomatic language",
} as const;

export type Level = keyof typeof LEVELS;
