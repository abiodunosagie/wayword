// FILE: lib/languages.ts
// The languages Wayword offers. The same codes are checked on the server
// (supabase/functions/wayword/languages.ts), so add a language in both places. `speech` is the
// voice the phone reads words aloud with.

export type Language = { code: string; name: string; speech: string };

export const LANGUAGES: Language[] = [
  { code: 'ar', name: 'Arabic', speech: 'ar-SA' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', speech: 'zh-CN' },
  { code: 'cs', name: 'Czech', speech: 'cs-CZ' },
  { code: 'da', name: 'Danish', speech: 'da-DK' },
  { code: 'nl', name: 'Dutch', speech: 'nl-NL' },
  { code: 'en', name: 'English', speech: 'en-GB' },
  { code: 'fi', name: 'Finnish', speech: 'fi-FI' },
  { code: 'fr', name: 'French', speech: 'fr-FR' },
  { code: 'de', name: 'German', speech: 'de-DE' },
  { code: 'el', name: 'Greek', speech: 'el-GR' },
  { code: 'ha', name: 'Hausa', speech: 'ha-NG' },
  { code: 'he', name: 'Hebrew', speech: 'he-IL' },
  { code: 'hi', name: 'Hindi', speech: 'hi-IN' },
  { code: 'hu', name: 'Hungarian', speech: 'hu-HU' },
  { code: 'ig', name: 'Igbo', speech: 'ig-NG' },
  { code: 'id', name: 'Indonesian', speech: 'id-ID' },
  { code: 'it', name: 'Italian', speech: 'it-IT' },
  { code: 'ja', name: 'Japanese', speech: 'ja-JP' },
  { code: 'ko', name: 'Korean', speech: 'ko-KR' },
  { code: 'nb', name: 'Norwegian', speech: 'nb-NO' },
  { code: 'pl', name: 'Polish', speech: 'pl-PL' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', speech: 'pt-BR' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', speech: 'pt-PT' },
  { code: 'ro', name: 'Romanian', speech: 'ro-RO' },
  { code: 'ru', name: 'Russian', speech: 'ru-RU' },
  { code: 'es', name: 'Spanish', speech: 'es-ES' },
  { code: 'sw', name: 'Swahili', speech: 'sw-KE' },
  { code: 'sv', name: 'Swedish', speech: 'sv-SE' },
  { code: 'th', name: 'Thai', speech: 'th-TH' },
  { code: 'tr', name: 'Turkish', speech: 'tr-TR' },
  { code: 'uk', name: 'Ukrainian', speech: 'uk-UA' },
  { code: 'vi', name: 'Vietnamese', speech: 'vi-VN' },
  { code: 'yo', name: 'Yoruba', speech: 'yo-NG' },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

export const languageName = (code: string) => byCode.get(code)?.name ?? code;
export const speechCode = (code: string) => byCode.get(code)?.speech ?? code;
export const isLanguage = (code: unknown): code is string => typeof code === 'string' && byCode.has(code);

/** The closest offered language to a device locale like "pt-PT", "pt" or "en-US". */
export function languageForLocale(tag: string | null | undefined): string | null {
  if (!tag) return null;
  if (byCode.has(tag)) return tag;
  const [base, region] = tag.split('-');
  if (base === 'pt') return region === 'BR' ? 'pt-BR' : 'pt-PT';
  if (base === 'zh') return 'zh-Hans';
  if (base === 'no' || base === 'nn') return 'nb';
  return byCode.has(base) ? base : null;
}

export type Level = 'beginner' | 'intermediate' | 'advanced';

export const LEVELS: { id: Level; name: string; hint: string }[] = [
  { id: 'beginner', name: 'Just starting', hint: 'A few words, maybe hello and thank you' },
  { id: 'intermediate', name: 'Getting by', hint: 'Simple everyday sentences' },
  { id: 'advanced', name: 'Fairly fluent', hint: 'You want it to sound natural' },
];
