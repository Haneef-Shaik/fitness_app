"""Stripping metadata out of an uploaded image.

**This runs on the server, and that is the point.** The client strips EXIF
before uploading (FR-N02.2), but a modified client simply does not, and a photo
of someone's kitchen carries the coordinates of their home. Either half alone is
a single point of failure for location data, so both halves exist.

Implemented by walking the container's own structure rather than by decoding and
re-encoding the image. Re-encoding would need an imaging library, would degrade
the photograph, and would be a far larger thing to trust: this reads a length
prefix and copies bytes.
"""
from __future__ import annotations

import struct
import zlib

JPEG_SOI = b"\xff\xd8"
JPEG_SOS = 0xDA
JPEG_EOI = 0xD9
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"

#: Everything an APPn segment can hold — EXIF (APP1), JFIF thumbnails (APP0),
#: Photoshop IRB (APP13), XMP (APP1 again) — plus COM, which is free text.
#: None of it is needed to render the image, so all of it goes.
_JPEG_DROP = set(range(0xE0, 0xF0)) | {0xFE}

#: PNG chunks that carry text or metadata. `eXIf` is literally EXIF; `tEXt`,
#: `zTXt` and `iTXt` are free text; `tIME` is a timestamp.
_PNG_DROP = {b"eXIf", b"tEXt", b"zTXt", b"iTXt", b"tIME"}


def strip_exif(data: bytes, content_type: str) -> bytes:
    """Return `data` with metadata segments removed.

    Anything this function does not understand is returned **unchanged** rather
    than mangled — the caller validates the content type, and silently damaging
    a file would be worse than leaving it alone.
    """
    if data.startswith(JPEG_SOI):
        return _strip_jpeg(data)
    if data.startswith(PNG_MAGIC):
        return _strip_png(data)
    return data


def _strip_jpeg(data: bytes) -> bytes:
    out = bytearray(JPEG_SOI)
    i = 2
    n = len(data)

    while i < n:
        if data[i] != 0xFF:
            # Out of step with the segment structure; copy the rest verbatim
            # rather than guessing where the next marker is.
            out += data[i:]
            break

        # Fill bytes (0xFF padding) are legal between segments.
        j = i
        while j < n and data[j] == 0xFF:
            j += 1
        if j >= n:
            out += data[i:]
            break

        marker = data[j]
        if marker == JPEG_EOI:
            out += b"\xff\xd9"
            i = j + 1
            continue
        if marker == JPEG_SOS:
            # The scan runs to the end of the file. Everything after this point
            # is entropy-coded image data and is copied untouched.
            out += data[i:]
            break
        if j + 3 > n:
            out += data[i:]
            break

        length = struct.unpack(">H", data[j + 1 : j + 3])[0]
        end = j + 1 + length
        if marker not in _JPEG_DROP:
            out += data[i:end]
        i = end

    return bytes(out)


def _strip_png(data: bytes) -> bytes:
    out = bytearray(PNG_MAGIC)
    i = len(PNG_MAGIC)
    n = len(data)

    while i + 8 <= n:
        length = struct.unpack(">I", data[i : i + 4])[0]
        kind = data[i + 4 : i + 8]
        end = i + 12 + length
        if end > n:
            out += data[i:]
            break
        if kind not in _PNG_DROP:
            out += data[i:end]
        i = end

    return bytes(out)


def is_supported_image(data: bytes) -> bool:
    """Whether the BYTES look like an image we handle, whatever the header said."""
    return data.startswith((JPEG_SOI, PNG_MAGIC))


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    """Test and fixture helper — builds a well-formed PNG chunk."""
    return (
        struct.pack(">I", len(payload)) + kind + payload
        + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
    )
