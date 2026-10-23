// FILE: components/confirm-action.tsx
// A destructive action that asks first, in place rather than in a pop-up: the quiet button opens
// a short explanation with the red button and a way back.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from '@/theme/theme';

import { Button } from './button';
import { Notice } from './notice';

type Props = {
  trigger: string;
  prompt: string;
  confirm: string;
  cancel?: string;
  onConfirm: () => Promise<void>;
  /** Shown under the prompt when the action failed; the prompt stays open to try again. When the
   * caller does not set it, a failed action shows a general message. */
  error?: string | null;
};

export function ConfirmAction({ trigger, prompt, confirm, cancel = 'Keep it', onConfirm, error }: Props) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!open) return <Button label={trigger} kind="quiet" onPress={() => setOpen(true)} />;
  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await onConfirm();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.wrap}>
      <Text style={t.body}>{prompt}</Text>
      {error || failed ? <Notice message={error ?? 'That did not work. Try again.'} /> : null}
      <Button label={confirm} kind="danger" onPress={run} busy={busy} />
      <Button label={cancel} kind="quiet" onPress={() => setOpen(false)} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: space.md } });
