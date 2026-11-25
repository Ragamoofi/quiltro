import { crc32, deflateSync, inflateSync } from 'node:zlib';

/** Minimal PNG encoder for 8-bit RGBA images (no dependencies). */
export function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData) >>> 0);
    return Buffer.concat([len, typeAndData, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** An image read back from a PNG: width, height and RGBA bytes. */
export interface DecodedPng {
  width: number;
  height: number;
  rgba: Uint8Array;
}

/**
 * Minimal PNG decoder (no dependencies) for what drawing programs save: 8-bit greyscale, RGB,
 * palette (with or without transparency), greyscale+alpha and RGBA, not interlaced.
 */
export function decodePng(buf: Buffer): DecodedPng {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (sig.some((b, i) => buf[i] !== b)) throw new Error('no es un PNG');
  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let type = 0;
  let interlace = 0;
  let palette: Buffer | null = null;
  let trns: Buffer | null = null;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const kind = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8] ?? 0;
      type = data[9] ?? 0;
      interlace = data[12] ?? 0;
    } else if (kind === 'PLTE') palette = data;
    else if (kind === 'tRNS') trns = data;
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error(`profundidad de color ${depth} bits: guárdalo como PNG de 8 bits (RGBA)`);
  if (interlace !== 0) throw new Error('PNG entrelazado: guárdalo sin entrelazado');
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[type];
  if (!channels) throw new Error(`tipo de color PNG ${type} no soportado`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = new Uint8Array(stride * height);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)] ?? 0;
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? (out[x - channels] ?? 0) : 0;
      const b = prev[x] ?? 0;
      const c = x >= channels ? (prev[x - channels] ?? 0) : 0;
      const v = line[x] ?? 0;
      let r: number;
      if (f === 0) r = v;
      else if (f === 1) r = v + a;
      else if (f === 2) r = v + b;
      else if (f === 3) r = v + ((a + b) >> 1);
      else {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[x] = r & 0xff;
    }
    px.set(out, y * stride);
    prev = out;
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    let rgb: [number, number, number];
    let a = 255;
    if (type === 6 || type === 2) {
      rgb = [px[s] ?? 0, px[s + 1] ?? 0, px[s + 2] ?? 0];
      if (type === 6) a = px[s + 3] ?? 0;
    } else if (type === 0 || type === 4) {
      const v = px[s] ?? 0;
      rgb = [v, v, v];
      if (type === 4) a = px[s + 1] ?? 0;
    } else {
      const idx = px[s] ?? 0;
      rgb = [palette?.[idx * 3] ?? 0, palette?.[idx * 3 + 1] ?? 0, palette?.[idx * 3 + 2] ?? 0];
      a = trns && idx < trns.length ? (trns[idx] ?? 255) : 255;
    }
    const [r, g, b] = rgb;
    rgba.set([r, g, b, a], i * 4);
  }
  return { width, height, rgba };
}
