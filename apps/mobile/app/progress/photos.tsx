/**
 * I-05 · Progress photos.
 *
 * **The most personal thing this app stores.** They go through the same signed
 * upload G8 built, which strips EXIF on arrival — a photo taken in somebody's
 * bathroom carries the coordinates of their home unless something removes them,
 * and the client's own strip is not enough because a modified client simply
 * does not run it.
 *
 * Unlike an AI analysis there is nothing to audit here: when the user deletes
 * one, the file goes too.
 */
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, View } from 'react-native';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { usePermissionGate } from '@/features/permissions/PermissionPrimer';
import { uploadPhoto } from '@/features/nutrition/uploadPhoto';
import {
  useCreateProgressPhoto, useDeleteProgressPhoto, useProgressPhotos,
} from '@/lib/query/hooks';
import { resolveApiUrl } from '@/lib/api';
import { radius, space } from '@/theme';

const POSES = ['front', 'side', 'back'] as const;

export default function ProgressPhotos() {
  const photos = useProgressPhotos();
  const create = useCreateProgressPhoto();
  const remove = useDeleteProgressPhoto();
  const [pose, setPose] = useState<(typeof POSES)[number]>('front');
  const [busy, setBusy] = useState(false);
  // L-06: the OS is asked only after FitLog has said what the camera is for.
  const { gate, element: primer } = usePermissionGate();
  const [error, setError] = useState<string | null>(null);

  const add = async (launch: () => Promise<ImagePicker.ImagePickerResult>) => {
    setError(null);
    setBusy(true);
    try {
      const picked = await launch();
      if (picked.canceled) return;
      const key = await uploadPhoto(picked.assets[0]!.uri);
      await create.mutateAsync({
        image_key: key, pose, taken_at: null, notes: null, client_id: null,
      });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'That photo did not upload.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold title="Progress photos">
      <View style={{ gap: space.lg }}>
        <Card>
          <Text variant="body">Same pose, same light, same time of day.</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
            Photos are resized and their location data removed before they leave your
            phone, and again when they arrive. Only you can see them.
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {POSES.map((p) => (
            <Button
              key={p}
              title={p}
              kind={p === pose ? 'primary' : 'ghost'}
              size="sm"
              style={{ flex: 1 }}
              testID={`pose-${p}`}
              onPress={() => setPose(p)}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            title={busy ? 'Uploading…' : 'Take one'}
            kind="ghost"
            style={{ flex: 1 }}
            disabled={busy}
            testID="photo-camera"
            onPress={() => { void gate('camera', () => { void add(() => ImagePicker.launchCameraAsync({ quality: 1 })); }); }}
          />
          <Button
            title="From library"
            kind="ghost"
            style={{ flex: 1 }}
            disabled={busy}
            testID="photo-library"
            onPress={() => { void gate('photos', () => { void add(() => ImagePicker.launchImageLibraryAsync({ quality: 1 })); }); }}
          />
        </View>

        {error ? (
          <Text variant="caption" tone="crit" testID="photo-error">{error}</Text>
        ) : null}

        <DataBoundary
          query={photos}
          isEmpty={(rows) => rows.length === 0}
          empty={{
            title: 'No photos yet',
            body: 'The scale misses what a photograph does not.',
          }}
        >
          {(rows) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {rows.map((photo) => (
                <View key={String(photo.id)} style={{ gap: 4 }}>
                  {/* The server's signed, expiring URL — never one built from
                      the key, which nothing serves without a signature. */}
                  {photo.image_url ? (
                    <Image
                      source={{ uri: resolveApiUrl(photo.image_url) }}
                      accessibilityLabel={`${photo.pose}, ${photo.local_date}`}
                      testID={`photo-image-${photo.id}`}
                      style={{ width: 96, height: 128, borderRadius: radius.btn }}
                    />
                  ) : null}
                  <Pill kind="mute">{photo.pose}</Pill>
                  <Text variant="caption" tone="ink3">{photo.local_date}</Text>
                  <Button
                    title="Delete"
                    kind="danger"
                    size="sm"
                    testID={`delete-photo-${photo.id}`}
                    onPress={() => remove.mutate(String(photo.id))}
                  />
                </View>
              ))}
            </View>
          )}
        </DataBoundary>
      </View>
      {primer}
    </ScreenScaffold>
  );
}
