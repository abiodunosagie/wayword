<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/banner-dark.svg">
  <img alt="Wayword: learn the language of the place you live" src="brand/banner.svg" width="100%">
</picture>

[![CI](https://github.com/abiodunosagie/wayword/actions/workflows/ci.yml/badge.svg)](https://github.com/abiodunosagie/wayword/actions/workflows/ci.yml)
![Expo](https://img.shields.io/badge/Expo-SDK%2058-2346B5)
![React Native](https://img.shields.io/badge/React%20Native-0.88-2346B5)
![License](https://img.shields.io/badge/license-MIT-2346B5)

Wayword is an open-source React Native app for people who have moved somewhere new and want to
learn the language from their own days, not from a textbook. Photograph a street sign, a menu, a
letter from the council or the label on a jar. Claude reads it, says what it means, explains the
parts that are hard to guess, and picks out the words worth keeping. Those words become cards,
each one tied to the photo it came from, and you practise them until they stick.

> **Status:** early. The brand, the Expo project and CI are in place; the screens below are being
> built now, one at a time, and this README will show real screenshots as each one lands.

## What it does

| Screen | What you do | What Claude does |
| --- | --- | --- |
| **Snap** | Point the camera at a sign, a menu, a form or a label | Reads the text from the photo, translates it, and explains it in plain words (vision) |
| **Keep** | Choose which of the suggested words to save | Returns each word with its meaning, an example sentence and a pronunciation hint as typed fields (structured output) |
| **Why?** | Tap any word or phrase to ask about it | Explains the grammar, how formal it is and what a local would say instead (streaming, with reasoning one tap away) |
| **Practise** | Review the day's cards, then say them out loud | Nothing: the schedule runs on the phone, offline, with spaced repetition |
| **Talk** | Rehearse a real situation: ordering from the menu you snapped, calling the landlord | Plays the other person, corrects you as you go, and saves new words with a tool call (tool use) |
| **This week** | Read a short story at your level | Writes it from the words you kept this week, so everything in it is yours |

Every card keeps the photo it came from. "Farmácia de serviço" is easier to remember when you can
see the green cross on your own street.

Any pair of languages works: you choose the language you speak and the language of the place.

## How it is built

```
Expo app (React Native)               Supabase                              Anthropic API
  camera, cards, practice              Edge function "claude"                Claude models
  cards and schedule in SQLite         1. signed-in user only
  on the phone (works offline)         2. per-user daily limits
  holds NO API key                     3. calls Claude, streams back
```

- **The Claude key never ships in the app.** Every request goes through a Supabase edge function
  that checks the user and their limits first.
- **Practice is local.** Cards, photos and the review schedule live on the phone in SQLite, so
  reviewing never waits for the network.
- **Expo, all the way.** Expo SDK 58, React Native 0.88, React 19, TypeScript, Expo Router,
  `expo-camera`, `expo-sqlite`, `expo-speech`. Native folders are generated, never edited by hand.

## Run it

```bash
npm install
npx expo start        # then press i for the iOS Simulator or a for Android
npm run typecheck     # TypeScript
npm run lint          # ESLint (eslint-config-expo)
```

## Brand

The mark is a tag, the kind you tie to a thing to say what it is: the marigold dot is where it
is tied to the world, the two lines are the word and what it means. Cobalt and marigold on white,
sky and marigold on near-black for dark mode. Every file (icon, splash, lockups, the animated
banner above and the social preview) is built by `python3 brand/generate.py`; see
[brand/BRAND.md](brand/BRAND.md).

## Licence

MIT. See [LICENSE](LICENSE). The bundled font, Schibsted Grotesk, is under the SIL Open Font
License ([brand/fonts/OFL.txt](brand/fonts/OFL.txt)).
