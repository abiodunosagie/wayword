// FILE: lib/secure-session.ts
// Where Supabase keeps the session on the phone. The session is encrypted with AES-256 and stored
// in the app's SQLite key-value store; the key itself lives in the iOS Keychain or Android
// Keystore (expo-secure-store), which caps values at 2 KB and so cannot hold the session itself.
// This is Supabase's recommended setup for Expo, with expo-sqlite in place of AsyncStorage.
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';

// Keychain keys allow only letters, numbers, ".", "-" and "_".
const keyName = (key: string) => `wayword.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;

export const secureSession = {
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = await Storage.getItem(key);
      if (!encrypted) return null;
      const hex = await SecureStore.getItemAsync(keyName(key));
      if (!hex) return null;
      const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(hex), new aesjs.Counter(1));
      const value = aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encrypted)));
      // Supabase stores JSON. Anything else means the key and the data no longer match (the app
      // was stopped between the two writes), so the session is dropped and you sign in again.
      JSON.parse(value);
      return value;
    } catch {
      await secureSession.removeItem(key).catch(() => {});
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    // A fresh key for every write, so the same counter is never reused with one key.
    const secret = Crypto.getRandomBytes(32);
    const cipher = new aesjs.ModeOfOperation.ctr(secret, new aesjs.Counter(1));
    const encrypted = aesjs.utils.hex.fromBytes(cipher.encrypt(aesjs.utils.utf8.toBytes(value)));
    await SecureStore.setItemAsync(keyName(key), aesjs.utils.hex.fromBytes(secret));
    await Storage.setItem(key, encrypted);
  },

  async removeItem(key: string): Promise<void> {
    await Storage.removeItem(key);
    await SecureStore.deleteItemAsync(keyName(key));
  },
};
