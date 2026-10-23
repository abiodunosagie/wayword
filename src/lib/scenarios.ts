// FILE: lib/scenarios.ts
// What you can rehearse in Talk: situations made from your own photos (order from the menu you
// snapped, ask about the sign) plus everyday ones. Pure, so it is covered by tests.
import type { Snap, SnapKind } from './types';

export type Scenario = { key: string; title: string; setting: string; from?: string };

// The server caps a situation's title at 120 characters, so the photo's title is shortened first.
const MAX_PHOTO_TITLE = 60;
const short = (title: string) => (title.length > MAX_PHOTO_TITLE ? `${title.slice(0, MAX_PHOTO_TITLE - 1).trim()}…` : title);

const FROM_PHOTO: Partial<Record<SnapKind, (title: string) => string>> = {
  menu: (t) => `Ordering from this menu (${t})`,
  sign: (t) => `Asking someone about this sign (${t})`,
  letter: (t) => `Phoning about this letter (${t})`,
  label: (t) => `Asking a shop assistant about this (${t})`,
  screen: (t) => `Asking for help with this screen (${t})`,
  note: (t) => `Talking about this note (${t})`,
};

export const EVERYDAY: Scenario[] = [
  { key: 'cafe', title: 'Ordering a coffee and a pastry at a café', setting: '' },
  { key: 'pharmacy', title: 'Asking a pharmacist for something for a cold', setting: '' },
  { key: 'landlord', title: 'Calling your landlord because the hot water is not working', setting: '' },
  { key: 'doctor', title: "Booking an appointment at the doctor's", setting: '' },
  { key: 'market', title: 'Buying fruit and vegetables at the market', setting: '' },
  { key: 'neighbour', title: 'Meeting your new neighbour in the stairwell', setting: '' },
  { key: 'directions', title: 'Asking a stranger for directions to the station', setting: '' },
  { key: 'bank', title: 'Opening a bank account', setting: '' },
];

/** Up to [max] situations from the newest photos, one per photo, kinds that suit a conversation. */
export function fromSnaps(snaps: Snap[], max = 4): Scenario[] {
  const out: Scenario[] = [];
  for (const snap of snaps) {
    const make = FROM_PHOTO[snap.kind];
    if (!make || !snap.source_text.trim()) continue;
    out.push({ key: `snap:${snap.id}`, title: make(short(snap.title)), setting: snap.source_text.slice(0, 2500), from: snap.id });
    if (out.length >= max) break;
  }
  return out;
}
