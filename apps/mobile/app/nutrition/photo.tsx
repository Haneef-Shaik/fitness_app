/**
 * H-09 · Photo capture — **AC-09**'s entry point.
 *
 * **A deviation from the wireframe, stated rather than hidden.** H-09 draws a
 * full in-app camera with a torch and a flip button. This uses the system
 * camera and library through `expo-image-picker` instead: it delivers the
 * substance — capture or pick, downscale, strip metadata, upload — without a
 * second native module and a permissions flow that cannot be exercised on the
 * hardware currently available (see G4's emulator finding). The custom preview
 * is a later change to this one file.
 *
 * The pipeline before upload is the wireframe's: ≤ 1600 px, JPEG q80, EXIF
 * dropped by the re-encode — and dropped again server-side, because a modified
 * client simply does not run this code.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { AiDegradedNotice } from '@/features/status/ServiceNotices';
import { usePermissionGate } from '@/features/permissions/PermissionPrimer';
import { uploadPhoto } from '@/features/nutrition/uploadPhoto';
import { useAnalyseImage, useAnalysisQuota } from '@/lib/query/hooks';
import { radius, space } from '@/theme';

export const MAX_PHOTOS = 4;

export default function Photo() {
  const [uris, setUris] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  // L-06: the OS is asked only after FitLog has said what the camera is for.
  const { gate, element: primer } = usePermissionGate();
  const [error, setError] = useState<string | null>(null);
  const submit = useAnalyseImage();
  const quota = useAnalysisQuota();

  const exhausted = (quota.data?.remaining ?? 1) <= 0;
  const full = uris.length >= MAX_PHOTOS;

  const add = async (launch: () => Promise<ImagePicker.ImagePickerResult>) => {
    setError(null);
    try {
      const picked = await launch();
      if (picked.canceled) return;
      setUris((rows) => [...rows, ...picked.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
    } catch {
      // A denied permission is not a dead screen: the other entry point still
      // works, and manual entry is always there.
      setError('That did not open. Try the other option, or add the meal by hand.');
    }
  };

  return (
    <ScreenScaffold title="Photograph your meal">
      <View style={{ gap: space.lg }}>
        <AiDegradedNotice />
        {exhausted ? (
          <Card>
            {/* Stated on entry, before a photo is taken (02 §5.4). */}
            <Text variant="body" testID="photo-quota-exhausted">
              You have used all of today&apos;s analyses.
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

        <Card>
          <Text variant="body">Fit the whole plate in the frame.</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Shoot from above if you can. Photos are resized and their location data
            removed before they leave your phone.
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title="Take a photo"
            kind="ghost"
            style={{ flex: 1 }}
            disabled={full || exhausted}
            testID="photo-camera"
            onPress={() => { void gate('camera', () => { void add(() => ImagePicker.launchCameraAsync({ quality: 1 })); }); }}
          />
          <Button
            title="From library"
            kind="ghost"
            style={{ flex: 1 }}
            disabled={full || exhausted}
            testID="photo-library"
            onPress={() => { void gate('photos', () => { void add(() => ImagePicker.launchImageLibraryAsync({
              quality: 1, allowsMultipleSelection: true, selectionLimit: MAX_PHOTOS,
            })); }); }}
          />
        </View>

        {uris.length > 0 ? (
          <View>
            <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
              {uris.length} photo{uris.length === 1 ? '' : 's'} added
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              {uris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={{ gap: 4 }}>
                  <Image
                    source={{ uri }}
                    accessibilityLabel={`Photo ${index + 1}`}
                    style={{ width: 72, height: 72, borderRadius: radius.btn }}
                  />
                  <Button
                    title="Remove"
                    kind="ghost"
                    size="sm"
                    testID={`photo-remove-${index}`}
                    onPress={() => setUris((rows) => rows.filter((_, i) => i !== index))}
                  />
                </View>
              ))}
            </View>
            {full ? (
              <Text variant="caption" tone="ink3" style={{ marginTop: space.sm }}>
                That is enough for one meal.
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <Text variant="caption" tone="crit" testID="photo-error">{error}</Text>
        ) : null}

        <Button
          title={busy ? 'Uploading…' : `Analyse ${uris.length} photo${uris.length === 1 ? '' : 's'}`}
          disabled={uris.length === 0 || busy || exhausted}
          testID="photo-analyse"
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              // One analysis per photo. A meal photographed from two angles is
              // two estimates the user reconciles on H-08, which is honest —
              // pretending one call saw both plates would not be.
              const key = await uploadPhoto(uris[0]!);
              const analysis = await submit.mutateAsync({ image_key: key, client_id: null });
              router.replace(`/nutrition/analysis/${analysis.id}`);
            } catch (e) {
              // The photo is kept. Nobody is made to retake it.
              setError(
                e instanceof Error && e.message
                  ? e.message
                  : 'The upload did not finish. Your photo is still here.',
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
      {primer}
    </ScreenScaffold>
  );
}
