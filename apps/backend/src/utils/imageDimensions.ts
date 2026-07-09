const BMP_HEADER = 0x42;
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MARKER = 0xff;
const GIF87 = "GIF87a";
const GIF89 = "GIF89a";
const WEBP_HEADER = "WEBP";

export function parseImageDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24) {
    throw new Error("File too small to be an image");
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return parseJPEG(buffer);
  }

  if (
    buffer[0] === PNG_HEADER[0] &&
    buffer[1] === PNG_HEADER[1] &&
    buffer[2] === PNG_HEADER[2] &&
    buffer[3] === PNG_HEADER[3]
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  const headerStr = buffer.toString("ascii", 0, 6);
  if (headerStr === GIF87 || headerStr === GIF89) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8),
    };
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === WEBP_HEADER) {
    return parseWebP(buffer);
  }

  if (buffer[0] === BMP_HEADER && buffer[1] === 0x4d) {
    return {
      width: buffer.readInt32LE(18),
      height: buffer.readInt32LE(22),
    };
  }

  throw new Error("Unsupported image format");
}

function parseJPEG(buffer: Buffer): { width: number; height: number } {
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== JPEG_MARKER) break;
    const marker = buffer[offset + 1];

    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      offset += 5;
      if (offset + 4 <= buffer.length) {
        return {
          height: buffer.readUInt16BE(offset),
          width: buffer.readUInt16BE(offset + 2),
        };
      }
      break;
    }

    if (marker === 0xd9 || marker === 0xda) break;

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    offset += length + 2;
  }

  throw new Error("Could not parse JPEG dimensions");
}

function parseWebP(buffer: Buffer): { width: number; height: number } {
  const isLossy = buffer[15] === 0x20;
  const isLossless = buffer[15] === 0x4c;
  const isExtended = buffer[15] === 0x58;

  if (isLossy) {
    if (buffer.length < 27) throw new Error("Invalid WebP file");
    const bits = buffer.readUInt32LE(18);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 16) & 0x3fff) + 1,
    };
  }

  if (isLossless || isExtended) {
    if (buffer.length < 30) throw new Error("Invalid WebP file");

    if (isLossless) {
      const bits = buffer.readUInt32LE(18);
      const widthBits = (bits & 0xfff) + 1;
      const heightBits = ((bits >> 12) & 0xfff) + 1;
      const signature = ((bits >> 24) & 0x3) === 0x3 ? 1 : 0;
      return {
        width: widthBits - signature,
        height: heightBits - signature,
      };
    }

    if (isExtended) {
      const bits = buffer.readUInt32LE(24);
      const bits2 = buffer.readUInt32LE(28);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits2 >> 16) & 0x3fff) + 1,
      };
    }
  }

  throw new Error("Could not parse WebP dimensions");
}
