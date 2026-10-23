// FILE: app/account.tsx
// The account sheet: your name, the languages and level Claude teaches you at, signing out, and
// deleting the account with everything it kept on this phone.
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmAction } from '@/components/confirm-action';
import { Field } from '@/components/field';
import { LanguagePicker } from '@/components/language-picker';
import { LevelChoice } from '@/components/level-choice';
import { Notice } from '@/components/notice';
import { Page } from '@/components/screen';
import { SectionLabel } from '@/components/section-label';
import { deleteAccountData } from '@/db/stories';
import { AuthError, deleteAccount, signOut, updateName } from '@/lib/auth';
import { deletePhoto } from '@/lib/photos';
import { validateName } from '@/lib/validate';
import { useLanguagePair, usePrefs } from '@/state/prefs';
import { useAccount } from '@/state/session';
import { space, useTheme } from '@/theme/theme';

type Step = 'view' | 'name';

export default function AccountSheet() {
  const { t } = useTheme();
  const db = useSQLiteContext();
  const account = useAccount();
  const prefs = useLanguagePair();
  const { save } = usePrefs();
  const [step, setStep] = useState<Step>('view');
  const [first, setFirst] = useState(account.firstName);
  const [last, setLast] = useState(account.lastName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const name = [account.firstName, account.lastName].filter(Boolean).join(' ');

  const saveName = async () => {
    const problem = validateName(first, 'first') ?? validateName(last, 'last');
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await updateName(first, last);
      setStep('view');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not save your name. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // The server delete cannot be undone, so once it succeeds everything after it is best effort:
  // the phone's copy is cleared as far as it can be and the session always ends.
  const remove = async () => {
    setDeleteError(null);
    try {
      await deleteAccount();
    } catch (e) {
      setDeleteError(e instanceof AuthError ? e.message : 'Could not delete the account. Try again.');
      return;
    }
    try {
      for (const photo of await deleteAccountData(db, account.id)) deletePhoto(photo);
    } finally {
      await signOut();
    }
  };

  const pickNative = (native: string) =>
    save({ ...prefs, native, target: native === prefs.target ? (native === 'en' ? 'pt-PT' : 'en') : prefs.target });

  return (
    <Page>
      <View style={styles.gap}>
        {name ? <Text style={t.title}>{name}</Text> : null}
        <Text style={t.muted} selectable>
          {account.email}
        </Text>
      </View>

      {step === 'name' ? (
        <View style={styles.gap}>
          <Field label="First name" value={first} onChangeText={setFirst} autoCapitalize="words" maxLength={50} />
          <Field label="Last name" value={last} onChangeText={setLast} autoCapitalize="words" maxLength={50} />
          {error ? <Notice message={error} /> : null}
          <Button label="Save name" onPress={saveName} busy={busy} />
          <Button label="Cancel" kind="quiet" onPress={() => setStep('view')} />
        </View>
      ) : (
        <Button label={name ? 'Change your name' : 'Add your name'} kind="secondary" onPress={() => setStep('name')} />
      )}

      <View>
        <SectionLabel>Languages</SectionLabel>
        <LanguagePicker label="I speak" value={prefs.native} onChange={pickNative} />
        <LanguagePicker label="I'm learning" value={prefs.target} onChange={(target) => save({ ...prefs, target })} exclude={prefs.native} />
        <Text style={[t.small, styles.note]}>Words, photos and talks are kept per language; switching back brings them back.</Text>
      </View>

      <View>
        <SectionLabel>Level</SectionLabel>
        <LevelChoice value={prefs.level} onChange={(level) => save({ ...prefs, level })} />
      </View>

      <Button label="Sign out" kind="secondary" onPress={() => signOut()} />

      <ConfirmAction
        trigger="Delete account"
        prompt="This deletes your account and every word, photo, talk and story it kept on this phone. It cannot be undone."
        confirm="Delete my account"
        cancel="Keep my account"
        onConfirm={remove}
        error={deleteError}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.md },
  note: { marginTop: space.sm },
});
