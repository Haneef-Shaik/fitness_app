/**
 * The client half of the H-09 upload pipeline (FR-N02.2).
 *
 * Downscale to ≤ 1600 px on the long edge, re-encode as JPEG at q80, then PUT
 * to a signed URL.
 *
 * **Re-encoding is how EXIF is stripped here.** `expo-image-manipulator` decodes
 * and re-encodes the pixels, and the metadata does not survive the round trip —
 * which is more reliable than parsing the container on the client, and is a
 * happy side effect of the resize the upload needs anyway.
 *
 * The server strips it again on arrival. **Both halves exist on purpose**: a
 * modified client simply does not run this file, and a photo of someone's
 * kitchen carries the coordinates of their home.
 */
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE, getAccessToken } from '@/lib/api';
import { analysisApi } from '@/lib/api-analysis';

export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.8;

export interface PreparedPhoto {
  uri: string;
  byteSize: number;
}

/** Downscale, compress, and drop the metadata with the re-encode. */
export async function preparePhoto(uri: string): Promise<PreparedPhoto> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_EDGE } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const info = await FileSystem.getInfoAsync(result.uri, { size: true });
  return {
    uri: result.uri,
    byteSize: info.exists && 'size' in info ? info.size : 0,
  };
}

/**
 * Prepare, sign and upload one photo. Returns the object key.
 *
 * The signed URL is relative, so it is joined to the same API base the rest of
 * the client uses — a key signed against one host and uploaded to another is a
 * class of bug that only shows up on a device.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  const photo = await preparePhoto(uri);

  const signed = await analysisApi.signUpload({
    content_type: 'image/jpeg',
    byte_size: photo.byteSize,
  });

  const response = await FileSystem.uploadAsync(
    `${API_BASE}${signed.upload_url}`,
    photo.uri,
    {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'content-type': 'image/jpeg',
        authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
    },
  );

  if (response.status < 200 || response.status >= 300) {
    // Kept deliberately plain: H-09 retries rather than making someone retake
    // the photograph, so this message is for the log, not the screen.
    throw new Error(`Upload failed with ${response.status}`);
  }

  return signed.key;
}
