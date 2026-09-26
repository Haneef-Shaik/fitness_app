/**
 * K-07 · Data & privacy (launch; BRD §18).
 *
 * Three things a person can do with their own data, each saying exactly what
 * it affects before it happens (the settings rule for anything destructive):
 *
 *   **Download my data** — the whole export as a file they can keep.
 *   **Delete my uploaded photos** — every stored image; meals keep their
 *   numbers and analyses keep their record.
 *   **Delete my account** — in the app, as Apple 5.1.1(v) and Google Play
 *   require: Settings → Data and privacy → Delete my account → Continue.
 *
 * What the wireframe has and this does not, yet: photo retention periods and
 * the analytics opt-out (no retention job, no analytics exist to opt out of),
 * and per-type counts in the deletion warning (no endpoint counts them).
 */
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ApiError } from '@/lib/api';
import { accountApi } from '@/lib/api-account';
import { legalLinks } from '@/lib/legal';
import { useDeleteAllPhotos } from '@/lib/query/hooks';
import { count } from '@/features/nutrition/format';
import { DeleteAccountFlow } from '@/features/privacy/DeleteAccountFlow';
import { saveExport, type SaveOutcome } from '@/features/privacy/saveExport';
import { space } from '@/theme';

function said(outcome: SaveOutcome): string {
  switch (outcome.kind) {
    case 'shared': return `Shared ${outcome.fileName}.`;
    case 'saved': return `Saved ${outcome.fileName} to the folder you chose.`;
    case 'downloaded': return `Downloaded ${outcome.fileName}.`;
    case 'kept':
      return `${outcome.fileName} is kept inside FitLog on this phone, where other apps can't `
        + 'open it. Download again and choose where to save it.';
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="label" accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

export default function Privacy() {
  const links = legalLinks();
  const deletePhotos = useDeleteAllPhotos();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [confirmPhotos, setConfirmPhotos] = useState(false);
  const [photos, setPhotos] = useState<string | null>(null);

  const download = async () => {
    setExporting(true); setExported(null);
    try {
      setExported(said(await saveExport(await accountApi.export())));
    } catch (e) {
      setExported(e instanceof ApiError
        ? e.message
        : "The download didn't finish. Check your connection and the space on this phone, then try again.");
    } finally {
      setExporting(false);
    }
  };

  const removePhotos = async () => {
    setPhotos(null);
    try {
      const out = await deletePhotos.mutateAsync();
      setPhotos(out.files_deleted === 0
        ? 'There were no photos to delete.'
        : `Deleted ${count(out.files_deleted, 'photo')}.`);
    } catch (e) {
      setPhotos(e instanceof ApiError ? e.message : "Couldn't reach the server. Nothing was deleted.");
    } finally {
      setConfirmPhotos(false);
    }
  };

  return (
    <ScreenScaffold title="Data and privacy">
      <View style={{ gap: space.xl }}>
        <Section title="Your data">
          <Card>
            <Text variant="title">Download my data</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Everything you've logged, as one JSON file: workouts, meals, food analyses, body
              measurements, goals and settings. Photos are listed, not included.
            </Text>
            <Button title="Download my data" kind="ghost" testID="export-data"
              loading={exporting} onPress={download} style={{ marginTop: space.base }} />
            {exported ? (
              <Text variant="body" tone="ink2" accessibilityLiveRegion="polite"
                style={{ marginTop: space.sm }}>{exported}</Text>
            ) : null}
          </Card>

          <Card>
            <Text variant="title">Delete my uploaded photos</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              Removes every photo you've uploaded — progress photos and food photos. Meals you
              saved from a food photo keep their nutrition, and each food analysis keeps its
              record without the picture.
            </Text>
            {confirmPhotos ? (
              <View testID="photos-confirm" style={{ marginTop: space.base }}>
                <Text variant="body">Delete every uploaded photo? This can't be undone.</Text>
                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                  <Button title="Keep them" kind="ghost" size="sm" style={{ flex: 1 }}
                    onPress={() => setConfirmPhotos(false)} />
                  <Button title="Delete photos" kind="danger" size="sm" style={{ flex: 1 }}
                    loading={deletePhotos.isPending} onPress={removePhotos} />
                </View>
              </View>
            ) : (
              <Button title="Delete my uploaded photos" kind="ghost" testID="delete-photos"
                onPress={() => { setPhotos(null); setConfirmPhotos(true); }}
                style={{ marginTop: space.base }} />
            )}
            {photos ? (
              <Text variant="body" tone="ink2" accessibilityLiveRegion="polite"
                style={{ marginTop: space.sm }}>{photos}</Text>
            ) : null}
          </Card>
        </Section>

        <Section title="How photos are stored">
          <Text variant="body" tone="ink2">
            Your photos are private: there's no public address for them. Location data is
            removed on this phone before a photo is uploaded, and again on our server. Food
            photos go to our AI provider only when you ask for an analysis.
          </Text>
          <Button title="Read the Privacy Policy" kind="ghost" size="sm"
            onPress={() => { void Linking.openURL(links.privacy); }} />
        </Section>

        <Section title="Your account">
          <DeleteAccountFlow onExport={download} webUrl={links.deleteAccount} />
        </Section>
      </View>
    </ScreenScaffold>
  );
}
