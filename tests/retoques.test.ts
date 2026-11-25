import { describe, expect, it } from 'vitest';
import { SPRITES } from '../src/art/sprites/index.ts';
import { decodePng, encodePng } from '../scripts/png.ts';
import { baseFrame, nearestChar, propagate, sheetAnims, sheetRgba, sheetToAnims, stripRgba, stripToFrames } from '../scripts/sprite-retouch.ts';

const quieto = SPRITES.find((s) => s.name === 'quiltro')?.animations.quieto;

describe('sprites retocados a mano', () => {
  it('an exported strip comes back as the same frames, at ×1 and at ×4', () => {
    const frames = quieto?.frames ?? [];
    for (const scale of [1, 4]) {
      const img = stripRgba(frames, scale);
      const back = decodePng(encodePng(img.width, img.height, img.rgba));
      const { frames: again, adjusted } = stripToFrames(back, frames.length, frames[0]?.[0]?.length ?? 0, frames[0]?.length ?? 0);
      expect(again).toEqual(frames);
      expect(adjusted).toBe(0);
    }
  });

  it('a colour outside the palette goes to the nearest one, and half-transparent pixels vanish', () => {
    expect(nearestChar(0xe6, 0x39, 0x46)).toEqual({ ch: 'r', exact: true });
    expect(nearestChar(0xe0, 0x40, 0x40).ch).toBe('r');
    const img = { width: 2, height: 1, rgba: new Uint8Array([0xe0, 0x40, 0x40, 255, 255, 255, 255, 60]) };
    const { frames, adjusted } = stripToFrames(img, 1, 2, 1);
    expect(frames).toEqual([['r.']]);
    expect(adjusted).toBe(1);
  });

  it('a strip with the wrong size explains what size it should have', () => {
    const img = { width: 10, height: 24, rgba: new Uint8Array(10 * 24 * 4) };
    expect(() => stripToFrames(img, 2, 24, 24)).toThrow(/ancho/);
  });

  it('a whole sheet (one animation per row) comes back as the same animations', () => {
    const gato = SPRITES.find((x) => x.name === 'gato');
    if (!gato) throw new Error('falta el gato');
    const sheet = sheetRgba(gato, 2);
    const { anims, adjusted } = sheetToAnims(decodePng(encodePng(sheet.width, sheet.height, sheet.rgba)), gato);
    expect(adjusted).toBe(0);
    for (const a of sheetAnims(gato)) expect(anims[a], a).toEqual(gato.animations[a]?.frames);
  });

  it('a change to the base frame reaches the other frames, also when the body is a pixel higher', () => {
    const base = ['....', '.ab.', '.cd.', '....'];
    const up = ['.ab.', '.cd.', '....', '....'];
    const closed = ['....', '.ab.', '.kk.', '....'];
    const anims = { quieto: { fps: 1, frames: [base] }, saltar: { fps: 1, frames: [up] }, ojo: { fps: 1, frames: [closed] } };
    const edited = ['....', '.ab.', '.cr.', '....'];
    const res = propagate(anims, ['quieto', 'saltar', 'ojo'], base, edited);
    expect(res.anims.quieto?.frames[0]).toEqual(edited);
    expect(res.anims.saltar?.frames[0]).toEqual(['.ab.', '.cr.', '....', '....']);
    // Where that pixel is drawn differently (an eye closed), the frame keeps its own drawing.
    expect(res.anims.ojo?.frames[0]).toEqual(closed);
  });

  it('every sprite has a base frame to export', () => {
    for (const def of SPRITES) expect(baseFrame(def), def.name).toBeDefined();
  });
});
