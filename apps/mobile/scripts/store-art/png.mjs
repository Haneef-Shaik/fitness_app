// Minimal, deterministic PNG codec for the DS-6 store-art generator.
// Writes 8-bit RGB (colour type 2) or RGBA (colour type 6), filter 0, no interlace and no ancillary
// chunks, so the same pixels always give the same bytes on the same zlib. The decoder reads back
// exactly that subset, which is all the generator's checks and tests need.
import { Buffer } from 'node:buffer';
import { deflateSync, inflateSync } from 'node:zlib';

export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const COLOUR_TYPE_BY_CHANNELS = new Map([
  [3, 2],
  [4, 6],
]);
const CHANNELS_BY_COLOUR_TYPE = new Map([
  [2, 3],
  [6, 4],
]);
const MAX_DIMENSION = 16384;

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

/** CRC-32 (ISO 3309, as PNG uses it) of a byte sequence, as an unsigned 32-bit number. */
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function assertDimensions(width, height) {
  const valid = (value) => Number.isInteger(value) && value > 0 && value <= MAX_DIMENSION;
  if (!valid(width) || !valid(height)) {
    throw new Error(`PNG width and height must be positive integers up to ${MAX_DIMENSION}, got ${width}×${height}`);
  }
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

/**
 * Encode 8-bit pixels as a PNG.
 * @param {{ width: number, height: number, channels: 3 | 4, pixels: Uint8Array }} image
 * @returns {Buffer}
 */
export function encodePng({ width, height, channels, pixels }) {
  assertDimensions(width, height);
  const colourType = COLOUR_TYPE_BY_CHANNELS.get(channels);
  if (colourType === undefined) {
    throw new Error(`PNG channels must be 3 (RGB) or 4 (RGBA), got ${channels}`);
  }
  const stride = width * channels;
  if (!(pixels instanceof Uint8Array) || pixels.length !== stride * height) {
    throw new Error(`Expected ${stride * height} pixel bytes, got ${pixels?.length}`);
  }
  const raw = Buffer.alloc((stride + 1) * height);
  for (let row = 0; row < height; row += 1) {
    // Each scanline starts with its filter byte; 0 (None) keeps encoding trivially reproducible.
    raw.set(pixels.subarray(row * stride, (row + 1) * stride), row * (stride + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = colourType;
  header[10] = 0; // compression: deflate
  header[11] = 0; // filter method
  header[12] = 0; // no interlace
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function readHeader(data) {
  if (data.length !== 13) {
    throw new Error('PNG IHDR must be 13 bytes');
  }
  const width = data.readUInt32BE(0);
  const height = data.readUInt32BE(4);
  assertDimensions(width, height);
  const [bitDepth, colourType, compression, filter, interlace] = data.subarray(8, 13);
  const channels = CHANNELS_BY_COLOUR_TYPE.get(colourType);
  if (bitDepth !== 8 || channels === undefined || compression !== 0 || filter !== 0 || interlace !== 0) {
    throw new Error('Only 8-bit, non-interlaced RGB or RGBA PNGs are supported');
  }
  return { width, height, channels };
}

/**
 * Decode a PNG written by encodePng (8-bit RGB/RGBA, filter 0, no interlace), checking every CRC.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number, channels: 3 | 4, pixels: Uint8Array }}
 */
export function decodePng(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG: bad signature');
  }
  let offset = 8;
  let header = null;
  let ended = false;
  const idat = [];
  while (offset < buffer.length && !ended) {
    if (offset + 12 > buffer.length) {
      throw new Error('Truncated PNG chunk');
    }
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataEnd = offset + 8 + length;
    if (dataEnd + 4 > buffer.length) {
      throw new Error(`Truncated PNG chunk ${type}`);
    }
    if (crc32(buffer.subarray(offset + 4, dataEnd)) !== buffer.readUInt32BE(dataEnd)) {
      throw new Error(`PNG chunk ${type} fails its CRC check`);
    }
    const data = buffer.subarray(offset + 8, dataEnd);
    if (type === 'IHDR') {
      header = readHeader(data);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      ended = true;
    }
    offset = dataEnd + 4;
  }
  if (header === null || !ended) {
    throw new Error('PNG is missing its IHDR or IEND chunk');
  }
  if (offset !== buffer.length) {
    throw new Error('Unexpected bytes after IEND');
  }
  const { width, height, channels } = header;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length !== (stride + 1) * height) {
    throw new Error(`PNG image data has ${raw.length} bytes, expected ${(stride + 1) * height}`);
  }
  const pixels = new Uint8Array(stride * height);
  for (let row = 0; row < height; row += 1) {
    const start = row * (stride + 1);
    if (raw[start] !== 0) {
      throw new Error(`Unsupported PNG filter ${raw[start]} on row ${row}`);
    }
    pixels.set(raw.subarray(start + 1, start + 1 + stride), row * stride);
  }
  return { width, height, channels, pixels };
}
