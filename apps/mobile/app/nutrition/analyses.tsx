/**
 * H-18 · Food analyses — the audit trail (BRD §18).
 *
 * **This is the AC-10 audit view.** Every analysis is here, including the ones
 * that failed and the ones that were never saved, showing what the model
 * proposed against what was actually logged. That record is a user's own
 * evidence of what was claimed on their behalf, which is why deleting the
 * photographs leaves the rows behind.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { FoodAnalysis } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useAnalyses, useDeleteAnalysisImages } from '@/lib/query/hooks';
import { space } from '@/theme';
import { count } from '@/features/nutrition/format';

export default function Analyses() {
  const query = useAnalyses();
  const deleteImages = useDeleteAnalysisImages();
  const [confirming, setConfirming] = useState(false);

  return (
    <ScreenScaffold title="Food analyses">
      <DataBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No analyses yet',
          body: 'Describe or photograph a meal and it will be recorded here.',
        }}
      >
        {(rows) => (
          <View style={{ gap: space.md }}>
            {rows.map((analysis) => <Row key={String(analysis.id)} analysis={analysis} />)}

            {rows.some((a) => a.image_key) ? (
              confirming ? (
                <Card>
                  <Text variant="body">Delete every stored photo?</Text>
                  {/* The distinction that makes this safe to offer. */}
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
                    The record of what was analysed stays. Only the photographs go,
                    and that cannot be undone.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.base }}>
                    <Button
                      title="Cancel"
                      kind="ghost"
                      size="sm"
                      style={{ flex: 1 }}
                      testID="analyses-cancel-delete"
                      onPress={() => setConfirming(false)}
                    />
                    <Button
                      title="Delete photos"
                      kind="danger"
                      size="sm"
                      style={{ flex: 1 }}
                      testID="analyses-confirm-delete"
                      onPress={async () => {
                        await deleteImages.mutateAsync();
                        setConfirming(false);
                      }}
                    />
                  </View>
                </Card>
              ) : (
                <Button
                  title="Delete all photos"
                  kind="ghost"
                  testID="analyses-delete-photos"
                  onPress={() => setConfirming(true)}
                />
              )
            ) : null}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function Row({ analysis }: { analysis: FoodAnalysis }) {
  const items = analysis.items ?? [];
  const saved = analysis.confirmed_meal_id !== null;

  return (
    <Pressable
      onPress={() => router.push(`/nutrition/analysis/${analysis.id}`)}
      accessibilityRole="button"
      accessibilityLabel={
        `${analysis.input_type === 'image' ? 'Photo' : 'Text'} analysis, `
        + `${count(items.length, 'food')}, ${saved ? 'saved' : 'not saved'}`
      }
      testID={`analysis-row-${analysis.id}`}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="body" style={{ flex: 1 }}>
            {analysis.input_type === 'image' ? '📷 Photo' : '✍️ Text'}
          </Text>
          {analysis.status === 'failed' ? (
            <Pill kind="mute">Failed</Pill>
          ) : saved ? (
            <Pill kind="good">Saved</Pill>
          ) : (
            <Pill kind="mute">Not saved</Pill>
          )}
        </View>

        {analysis.source_text ? (
          <Text variant="caption" tone="ink3" numberOfLines={1} style={{ marginTop: 4 }}>
            &ldquo;{analysis.source_text}&rdquo;
          </Text>
        ) : null}

        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
          {analysis.created_at.slice(0, 16).replace('T', ' ')} ·{' '}
          {items.length} food{items.length === 1 ? '' : 's'}
          {analysis.model_name ? ` · ${analysis.model_name}` : ''}
          {analysis.image_key ? ' · photo kept' : ''}
        </Text>
      </Card>
    </Pressable>
  );
}
