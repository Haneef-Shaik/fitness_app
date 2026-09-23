/**
 * H-06 · Describe your meal (text AI) — **AC-08**.
 *
 * Two promises this screen makes and keeps:
 *
 * **Nothing is saved yet.** The sentence is on the screen before the button,
 * because a user who thinks pressing this logs a meal will not review what
 * comes back — and the review is the whole design (BRD §12.7).
 *
 * **Your words are kept.** If the model finds nothing, H-08 opens with the text
 * still in it. Making somebody retype their dinner is unforgivable.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { TextInput } from '@/ui/TextInput';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useAnalyseText, useAnalysisQuota } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

const MAX_CHARS = 1000;
const MIN_CHARS = 3;

const EXAMPLES = [
  'a bowl of dal and 2 rotis',
  '250 ml milk with 2 scoops whey',
];

export default function Describe() {
  const { c } = useTheme();
  const [text, setText] = useState('');
  const submit = useAnalyseText();
  const quota = useAnalysisQuota();
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const exhausted = (quota.data?.remaining ?? 1) <= 0;
  const tooLong = text.length > MAX_CHARS;
  const blocked = trimmed.length < MIN_CHARS || tooLong || exhausted || submit.isPending;

  return (
    <ScreenScaffold title="Describe your meal">
      <View style={{ gap: space.lg }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={5}
          placeholder="2 eggs, 3 rotis and 200g chicken curry"
          placeholderTextColor={c.ink3}
          accessibilityLabel="What did you eat?"
          testID="describe-text"
          style={{
            minHeight: 120, textAlignVertical: 'top', borderRadius: radius.btn,
            borderWidth: 1, borderColor: tooLong ? c.crit : c.line2,
            padding: space.md, color: c.ink, backgroundColor: c.sunken,
          }}
        />
        <Text variant="caption" tone="ink3">
          Write it however you would say it. Amounts help.
        </Text>

        {/* The counter appears at 80%, not at 100% — a limit discovered by
            being blocked by it is a limit discovered too late. */}
        {text.length > MAX_CHARS * 0.8 ? (
          <Text
            variant="caption"
            tone={tooLong ? 'crit' : 'ink3'}
            testID="describe-counter"
          >
            {text.length} / {MAX_CHARS}
            {tooLong ? ' — that is a lot for one meal. Try splitting it in two.' : ''}
          </Text>
        ) : null}

        <View>
          <Text variant="label" style={{ marginBottom: space.sm }}>Try</Text>
          <View style={{ gap: space.sm }}>
            {EXAMPLES.map((example) => (
              <Button
                key={example}
                title={example}
                kind="ghost"
                size="sm"
                testID={`describe-example-${EXAMPLES.indexOf(example)}`}
                onPress={() => setText(example)}
              />
            ))}
          </View>
        </View>

        <Card>
          {/* Said before the button, not after. */}
          <Text variant="body">
            We will estimate the nutrition and show it to you before anything is saved.
          </Text>
          {quota.data ? (
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }} testID="describe-quota">
              {quota.data.remaining} of {quota.data.limit} analyses left today.
            </Text>
          ) : null}
        </Card>

        {exhausted ? (
          <Card>
            <Text variant="body" testID="describe-quota-exhausted">
              You have used all of today&apos;s analyses.
            </Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              You can still add meals by hand, and that costs nothing.
            </Text>
            <Button
              title="Add it manually"
              kind="ghost"
              size="sm"
              style={{ marginTop: space.sm }}
              onPress={() => router.replace('/nutrition/add')}
            />
          </Card>
        ) : null}

        {error ? (
          <Text variant="caption" tone="crit" testID="describe-error">{error}</Text>
        ) : null}

        <Button
          title={submit.isPending ? 'Estimating…' : 'Estimate nutrition'}
          disabled={blocked}
          testID="describe-submit"
          onPress={async () => {
            setError(null);
            try {
              const analysis = await submit.mutateAsync({ text: trimmed, client_id: null });
              router.replace(`/nutrition/analysis/${analysis.id}`);
            } catch (e) {
              setError(
                e instanceof Error && e.message
                  ? e.message
                  : 'That did not go through. Your text is still here.',
              );
            }
          }}
        />
        {trimmed.length > 0 && trimmed.length < MIN_CHARS ? (
          <Text variant="caption" tone="ink3" testID="describe-too-short">
            Tell us a bit more.
          </Text>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
