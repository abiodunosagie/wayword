// FILE: app/sign-in.tsx
// Sign in, or create an account with your name. One form, two modes. The mark and the greeting sit
// up top; the form sits low, near your thumb. On success the root layout moves to the app by itself.
import { type ComponentRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Mark } from '@/components/mark';
import { Notice } from '@/components/notice';
import { AuthError, signIn, signUp } from '@/lib/auth';
import { validateEmail, validateName, validateNewPassword, validatePassword } from '@/lib/validate';
import { minTap, space, useTheme } from '@/theme/theme';

type Errors = Partial<Record<'first' | 'last' | 'email' | 'password', string | null>>;

export default function SignIn() {
  const { c, t } = useTheme();
  const [creating, setCreating] = useState(false);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async () => {
    const next: Errors = {
      email: validateEmail(email),
      password: creating ? validateNewPassword(password) : validatePassword(password),
      ...(creating ? { first: validateName(first, 'first'), last: validateName(last, 'last') } : {}),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!creating) await signIn(email, password);
      else if (await signUp(email, password, first, last)) {
        setMessage({ text: 'Check your inbox and confirm your email, then sign in.', tone: 'info' });
        setCreating(false);
      }
    } catch (error) {
      setMessage({ text: error instanceof AuthError ? error.message : 'Something went wrong. Try again.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setCreating((v) => !v);
    setErrors({});
    setMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: c.background }]}
    >
      <ScrollView
        // The form sits at the bottom of a full-height page, so the safe areas are added here
        // rather than by the scroll view, which would make the page taller than the screen.
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.lg }]}
      >
        <View style={styles.top}>
          <Mark size={56} />
          <Text style={t.display}>{creating ? 'Create your account.' : 'Welcome back.'}</Text>
          <Text style={t.muted}>
            {creating ? 'Your words and practice stay on this phone, saved to your account.' : 'Pick up where you left off.'}
          </Text>
        </View>
        <View style={styles.form}>
          {creating ? (
            <View style={styles.names}>
              <View style={styles.flex}>
                <Field label="First name" value={first} onChangeText={setFirst} error={errors.first}
                  autoComplete="given-name" textContentType="givenName" autoCapitalize="words" maxLength={50} />
              </View>
              <View style={styles.flex}>
                <Field label="Last name" value={last} onChangeText={setLast} error={errors.last}
                  autoComplete="family-name" textContentType="familyName" autoCapitalize="words" maxLength={50} />
              </View>
            </View>
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Field
            ref={passwordRef}
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoComplete={creating ? 'new-password' : 'current-password'}
            textContentType={creating ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {message ? <Notice message={message.text} tone={message.tone} /> : null}
          <Button label={creating ? 'Create account' : 'Sign in'} onPress={submit} busy={busy} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={creating ? 'Have an account? Sign in' : 'New to Wayword? Create an account'}
            onPress={busy ? undefined : switchMode}
            style={({ pressed }) => [styles.switch, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={t.muted}>
              {creating ? 'Have an account? ' : 'New to Wayword? '}
              <Text style={t.link}>{creating ? 'Sign in' : 'Create an account'}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: space.xl, gap: space.xxl },
  top: { gap: space.md },
  form: { gap: space.lg },
  names: { flexDirection: 'row', gap: space.md },
  flex: { flex: 1 },
  switch: { alignItems: 'center', justifyContent: 'center', minHeight: minTap },
});
