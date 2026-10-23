// FILE: lib/speech.ts
// Reads a word or sentence aloud with the phone's own voice for that language. Works offline
// once the phone has the voice; a new tap stops the last one first.
import * as Speech from 'expo-speech';

import { speechCode } from './languages';

export function say(text: string, language: string): void {
  Speech.stop();
  Speech.speak(text, { language: speechCode(language), rate: 0.9 });
}
