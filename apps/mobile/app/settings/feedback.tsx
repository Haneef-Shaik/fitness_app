/**
 * Report a problem / send an idea (launch plan, phase 8).
 *
 * The report carries the app version, the platform and the request id of the
 * last call the server refused — never what was typed into that call — so "it
 * didn't save" can be traced to the server's own record of why.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { Button, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { TextInput } from '@/ui/TextInput';
import { Chips, Labelled } from '@/features/onboarding/ui';
import { ApiError, api, lastFailedRequestId } from '@/lib/api';
import { radius, space, useTheme } from '@/theme';

type Category = 'problem' | 'idea' | 'other';
const MAX = 2000;

export function appVersion(): string {
  const v = Constants?.expoConfig?.version ?? 'dev';
  const build = Platform.OS === 'ios'
    ? Constants?.expoConfig?.ios?.buildNumber
    : Constants?.expoConfig?.android?.versionCode;
  return build ? `${v} (${build})` : v;
}

export default function Feedback() {
  const { c } = useTheme();
  const [category, setCategory] = useState<Category>('problem');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const requestId = lastFailedRequestId();

  const send = async () => {
    setError(null);
    setBusy(true);
    try {
      await api.post('/feedback', {
        category, message: message.trim(),
        app_version: appVersion(),
        platform: `${Platform.OS} ${String(Platform.Version)}`,
        request_id: category === 'problem' ? requestId : null,
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError && e.status < 500
        ? (Object.values(e.fields)[0] ?? e.message)
        : "That didn't send. Check your connection and try again — your message is still here.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <ScreenScaffold title="Thanks">
        <View style={{ gap: space.md }} testID="feedback-sent">
          <Text variant="body">Got it. We read every one of these.</Text>
          <Button title="Done" onPress={() => router.back()} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Send feedback" subtitle="A problem, an idea, anything">
      <View style={{ gap: space.lg }}>
        <Labelled label="What is it about?">
          <Chips
            testID="feedback-category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'problem', label: 'Something went wrong' },
              { value: 'idea', label: 'An idea' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Labelled>
        <TextInput
          testID="feedback-message"
          accessibilityLabel="Your message"
          value={message}
          onChangeText={setMessage}
          placeholder={category === 'problem' ? 'What were you doing, and what happened?' : 'Tell us'}
          placeholderTextColor={c.ink3}
          maxLength={MAX}
          multiline
          style={{
            minHeight: 160, padding: space.md, textAlignVertical: 'top',
            borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            color: c.ink, backgroundColor: c.sunken,
          }}
        />
        <Text variant="caption" tone="ink3">
          Sent with the app version and your phone's system{category === 'problem' && requestId
            ? ', plus a reference to the last error so we can find it in our logs' : ''}.
          Please don't include passwords or health details you'd rather keep private.
        </Text>
        {error ? <Text variant="caption" tone="crit" testID="feedback-error">{error}</Text> : null}
        <Button title="Send" loading={busy} disabled={!message.trim()} testID="feedback-send"
          onPress={() => { void send(); }} />
      </View>
    </ScreenScaffold>
  );
}
