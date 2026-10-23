/// <reference types="node" />
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { LANGUAGES, languageForLocale } from './languages';

describe('languages', () => {
  it('offers exactly the languages the server accepts', () => {
    const file = readFileSync(join(__dirname, '../../supabase/functions/wayword/languages.ts'), 'utf8');
    const server = file.slice(file.indexOf('LANGUAGES'), file.indexOf('LEVELS'));
    const codes = [...server.matchAll(/^\s+"?([a-zA-Z-]+)"?: "/gm)].map((m) => m[1]);
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(codes.sort());
  });

  it('maps phone locales to an offered language', () => {
    expect(languageForLocale('pt-BR')).toBe('pt-BR');
    expect(languageForLocale('pt-AO')).toBe('pt-PT');
    expect(languageForLocale('en-NG')).toBe('en');
    expect(languageForLocale('zh-Hant-TW')).toBe('zh-Hans');
    expect(languageForLocale('xx-YY')).toBeNull();
    expect(languageForLocale(undefined)).toBeNull();
  });
});
