/**
 * The client half of the upload pipeline.
 *
 * What is asserted is the **order and the parameters**, because that is where
 * the privacy guarantee lives: the image is re-encoded (which is what drops the
 * EXIF) before its size is measured, and the size that is measured is the one
 * the URL is signed for. Signing for the original and uploading the resized one
 * would work, and would mean the limit protects nothing.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { JPEG_QUALITY, MAX_EDGE, preparePhoto, uploadPhoto } from '../uploadPhoto';
import { analysisApi } from '@/lib/api-analysis';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: 'file:///small.jpg' })),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 123456 })),
  uploadAsync: jest.fn(() => Promise.resolve({ status: 200, body: '' })),
  FileSystemUploadType: { BINARY_CONTENT: 'binary' },
}));

jest.mock('@/lib/api-analysis', () => ({
  analysisApi: {
    signUpload: jest.fn(() => Promise.resolve({
      key: 'uploads/u/abc.jpg', upload_url: '/v1/uploads/uploads/u/abc.jpg?sig=x',
    })),
  },
}));

jest.mock('@/lib/api', () => ({
  API_BASE: 'http://10.0.0.1:8000',
  getAccessToken: () => 'token-123',
}));

const manipulate = ImageManipulator.manipulateAsync as jest.Mock;
const upload = FileSystem.uploadAsync as jest.Mock;
const sign = analysisApi.signUpload as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('preparing', () => {
  it('resizes to the long-edge limit and re-encodes as JPEG', async () => {
    await preparePhoto('file:///original.heic');

    expect(manipulate).toHaveBeenCalledWith(
      'file:///original.heic',
      [{ resize: { width: MAX_EDGE } }],
      { compress: JPEG_QUALITY, format: 'jpeg' },
    );
  });

  it('reports the size of the RE-ENCODED file, not the original', async () => {
    const prepared = await preparePhoto('file:///original.jpg');

    // The re-encode is what strips the metadata, so its size is the one the
    // signature must cover.
    expect(prepared.uri).toBe('file:///small.jpg');
    expect(prepared.byteSize).toBe(123456);
    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///small.jpg');
  });
});

describe('uploading', () => {
  it('signs for the prepared size and PUTs to the same API host', async () => {
    const key = await uploadPhoto('file:///original.jpg');

    expect(sign).toHaveBeenCalledWith({ content_type: 'image/jpeg', byte_size: 123456 });
    // A key signed against one host and uploaded to another is a bug that only
    // ever appears on a device.
    expect(upload).toHaveBeenCalledWith(
      'http://10.0.0.1:8000/v1/uploads/uploads/u/abc.jpg?sig=x',
      'file:///small.jpg',
      expect.objectContaining({ httpMethod: 'PUT' }),
    );
    expect(key).toBe('uploads/u/abc.jpg');
  });

  it('carries the bearer token — a signed URL is not a bypass', async () => {
    await uploadPhoto('file:///original.jpg');

    const options = upload.mock.calls[0]![2] as { headers: Record<string, string> };
    expect(options.headers.authorization).toBe('Bearer token-123');
  });

  it('throws on a non-2xx so the screen can keep the photo', async () => {
    upload.mockResolvedValueOnce({ status: 413, body: '' });

    await expect(uploadPhoto('file:///original.jpg')).rejects.toThrow('413');
  });
});
