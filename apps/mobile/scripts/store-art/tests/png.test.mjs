import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { describe, it } from 'node:test';

import { crc32, decodePng, encodePng, PNG_SIGNATURE } from '../png.mjs';

describe('crc32', () => {
  it('matches the standard CRC-32 check value', () => {
    assert.equal(crc32(Buffer.from('123456789', 'ascii')), 0xcbf43926);
  });

  it('matches the well-known CRC of an empty IEND chunk', () => {
    assert.equal(crc32(Buffer.from('IEND', 'ascii')), 0xae426082);
  });
});

describe('encodePng and decodePng', () => {
  const rgba = Object.freeze({
    width: 2,
    height: 2,
    channels: 4,
    pixels: Uint8Array.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 1, 2, 3, 4]),
  });

  it('round-trips RGBA pixels exactly', () => {
    const decoded = decodePng(encodePng(rgba));
    assert.equal(decoded.width, 2);
    assert.equal(decoded.height, 2);
    assert.equal(decoded.channels, 4);
    assert.deepEqual(Array.from(decoded.pixels), Array.from(rgba.pixels));
  });

  it('writes RGB as colour type 2 (no alpha channel) at 8 bits', () => {
    const rgb = { width: 3, height: 1, channels: 3, pixels: Uint8Array.from([14, 15, 10, 202, 253, 0, 255, 255, 255]) };
    const png = encodePng(rgb);
    assert.ok(png.subarray(0, 8).equals(PNG_SIGNATURE));
    assert.equal(png.toString('ascii', 12, 16), 'IHDR');
    assert.equal(png.readUInt32BE(16), 3, 'width');
    assert.equal(png.readUInt32BE(20), 1, 'height');
    assert.equal(png[24], 8, 'bit depth');
    assert.equal(png[25], 2, 'colour type: truecolour without alpha');
    assert.deepEqual(Array.from(decodePng(png).pixels), Array.from(rgb.pixels));
  });

  it('writes RGBA as colour type 6', () => {
    assert.equal(encodePng(rgba)[25], 6);
  });

  it('ends with an IEND chunk and adds no ancillary chunks', () => {
    const png = encodePng(rgba);
    assert.equal(png.toString('ascii', png.length - 8, png.length - 4), 'IEND');
    const types = [];
    for (let offset = 8; offset < png.length; ) {
      const length = png.readUInt32BE(offset);
      types.push(png.toString('ascii', offset + 4, offset + 8));
      offset += 12 + length;
    }
    assert.deepEqual(types, ['IHDR', 'IDAT', 'IEND']);
  });

  it('is byte-for-byte deterministic', () => {
    assert.ok(encodePng(rgba).equals(encodePng(rgba)));
  });

  it('rejects a pixel buffer of the wrong length', () => {
    assert.throws(() => encodePng({ ...rgba, pixels: new Uint8Array(15) }), /Expected 16 pixel bytes/);
  });

  it('rejects unsupported channel counts', () => {
    assert.throws(() => encodePng({ ...rgba, channels: 2, pixels: new Uint8Array(8) }), /channels must be 3/);
  });

  it('rejects non-integer dimensions', () => {
    assert.throws(() => encodePng({ ...rgba, width: 1.5 }), /positive integers/);
  });

  it('detects a corrupted chunk through its CRC', () => {
    const png = Buffer.from(encodePng(rgba));
    png[20] ^= 0xff;
    assert.throws(() => decodePng(png), /CRC/);
  });

  it('rejects data that is not a PNG', () => {
    assert.throws(() => decodePng(Buffer.from('definitely not a png file', 'ascii')), /signature/);
  });

  it('rejects bytes after IEND', () => {
    assert.throws(() => decodePng(Buffer.concat([encodePng(rgba), Buffer.from([0])])), /after IEND/);
  });
});
