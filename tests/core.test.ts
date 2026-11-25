import { describe, expect, it } from 'vitest';
import { advance, MAX_FRAME, STEP } from '../src/core/loop.ts';
import { hash2, Rng, seedFromString } from '../src/core/rng.ts';
import { fitDisplay } from '../src/core/display.ts';

describe('Rng (mulberry32)', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('matches the reference mulberry32 sequence', () => {
    // Reference values for seed 1 (canonical mulberry32 implementation).
    const r = new Rng(1);
    expect(r.next()).toBeCloseTo(0.6270739405881613, 12);
    expect(r.next()).toBeCloseTo(0.002735721180215478, 12);
    expect(r.next()).toBeCloseTo(0.5274470399599522, 12);
  });

  it('stays in range', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 5);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(5);
    }
  });

  it('weighted picks follow weights roughly', () => {
    const r = new Rng(123);
    const counts = [0, 0];
    for (let i = 0; i < 10000; i++) counts[r.weighted([9, 1])]!++;
    expect(counts[0]! / 10000).toBeGreaterThan(0.85);
    expect(counts[0]! / 10000).toBeLessThan(0.95);
  });

  it('seeds from a date string the same way every time', () => {
    expect(seedFromString('2026-11-24')).toBe(seedFromString('2026-11-24'));
    expect(seedFromString('2026-11-24')).not.toBe(seedFromString('2026-11-25'));
  });

  it('hash2 is stable and in [0, 1)', () => {
    expect(hash2(3, -4)).toBe(hash2(3, -4));
    for (let i = -20; i < 20; i++) {
      const h = hash2(i, i * 7);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });
});

describe('fixed-step loop', () => {
  it('runs one update per 1/60 s', () => {
    const r = advance(0, STEP * 3 + STEP / 2, 1);
    expect(r.steps).toBe(3);
    expect(r.accumulator).toBeCloseTo(STEP / 2);
  });

  it('slow motion scales game time, not frames', () => {
    let acc = 0;
    let steps = 0;
    for (let i = 0; i < 60; i++) {
      const r = advance(acc, STEP, 0.3);
      acc = r.accumulator;
      steps += r.steps;
    }
    expect(steps).toBe(18);
  });

  it('caps huge frames (tab switch) to avoid a spiral of death', () => {
    expect(advance(0, 10, 1).steps).toBe(Math.floor(MAX_FRAME / STEP + 1e-9));
  });
});

describe('integer pixel scaling', () => {
  it('fits 480×270 landscape at the largest whole scale', () => {
    const f = fitDisplay(1920, 1080, 1);
    expect(f).toMatchObject({ width: 480, height: 270, scale: 4, portrait: false });
    expect(f.cssWidth).toBe(1920);
  });

  it('never stretches to the whole window: leftover space becomes border', () => {
    // 1366×768 would fit ×2,84: a whole ×2 fills only 70 %, so it steps up to ×2,5 (never to ×3, which would not fit).
    const f = fitDisplay(1366, 768, 1);
    expect(f.scale).toBe(2.5);
    expect(f.cssWidth).toBe(1200);
    expect(f.cssHeight).toBe(675);
  });

  it('a 1080p screen with a browser window about 955 px tall uses ×3,5 instead of leaving a quarter of the screen empty', () => {
    const f = fitDisplay(1920, 955, 1);
    expect(f.scale).toBe(3.5);
    expect(f.cssWidth).toBe(1680);
    expect(f.cssHeight).toBe(945);
    // It always fits.
    expect(f.cssHeight).toBeLessThanOrEqual(955);
  });

  it('keeps a whole scale when it already fills the screen well', () => {
    expect(fitDisplay(1920, 1080, 1).scale).toBe(4);
    expect(fitDisplay(1440, 810, 1).scale).toBe(3);
    // Windows at 125 %: 1536×864 css = 1920×1080 device pixels, exactly ×4.
    expect(fitDisplay(1536, 864, 1.25).scale).toBe(4);
  });

  it('the canvas never exceeds the window, at any size', () => {
    for (const [w, h, dpr] of [
      [1280, 720, 1],
      [1366, 768, 1],
      [1600, 900, 1],
      [1920, 937, 1],
      [2560, 1300, 1],
      [1536, 730, 1.25],
      [800, 600, 1],
      [390, 844, 3],
    ] as const) {
      const f = fitDisplay(w, h, dpr);
      expect(f.cssWidth, `${w}×${h}`).toBeLessThanOrEqual(w + 0.001);
      expect(f.cssHeight, `${w}×${h}`).toBeLessThanOrEqual(h + 0.001);
    }
  });

  it('switches to 270×480 in portrait and scales in device pixels', () => {
    const f = fitDisplay(390, 844, 3);
    expect(f).toMatchObject({ width: 270, height: 480, portrait: true, scale: 4 });
    expect(f.cssWidth * 3).toBe(270 * 4);
  });
});
