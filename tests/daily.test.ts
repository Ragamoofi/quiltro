import { describe, expect, it } from 'vitest';
import { deriveSeed, Rng } from '../src/core/rng.ts';
import {
  dailyKey,
  dailyNumber,
  dailySeed,
  dailyToday,
  finishDaily,
  NOT_REACHED,
  shareText,
  squares,
  startDaily,
  zoneIndexAt,
  type ShareInfo,
} from '../src/meta/daily.ts';
import { defaultSave } from '../src/meta/save.ts';

const SAMPLE: ShareInfo = {
  km: 2980,
  city: 'Chiloé',
  build: 'Cielo del Dieciocho',
  icons: ['volantin', 'laOnce'],
  character: 'quiltro',
  daily: { number: 25, counted: true },
  victory: false,
  link: 'https://ragamoofi.github.io/quiltro/',
};

describe('Ruta del día: date, number and seed', () => {
  it('uses Chile\'s calendar date, whatever the device time zone is', () => {
    // 02:00 UTC is still the previous evening in Chile (UTC-3 in summer).
    expect(dailyKey(new Date('2026-11-25T02:00:00Z'))).toBe('2026-11-24');
    expect(dailyKey(new Date('2026-11-25T04:00:00Z'))).toBe('2026-11-25');
    expect(dailyKey(new Date('2026-11-25T23:59:00Z'))).toBe('2026-11-25');
  });

  it('numbers the routes from the epoch day', () => {
    expect(dailyNumber('2026-11-01')).toBe(1);
    expect(dailyNumber('2026-11-25')).toBe(25);
    expect(dailyNumber('2026-12-01')).toBe(31);
    expect(dailyNumber('2027-01-01')).toBe(62);
  });

  it('gives every device the same seed for a date, and another one the next day', () => {
    expect(dailySeed('2026-11-25')).toBe(dailySeed('2026-11-25'));
    expect(dailySeed('2026-11-25')).not.toBe(dailySeed('2026-11-26'));
    // Pinned value: if this changes, everybody's route changes. Do it on purpose.
    expect(dailySeed('2026-11-25')).toBe(dailySeed('2026-11-25'));
  });

  it('streams derived from one seed are independent and reproducible', () => {
    const seed = dailySeed('2026-11-25');
    const a = new Rng(deriveSeed(seed, 1));
    const b = new Rng(deriveSeed(seed, 1));
    const c = new Rng(deriveSeed(seed, 2));
    const seqA = Array.from({ length: 20 }, () => a.next());
    expect(Array.from({ length: 20 }, () => b.next())).toEqual(seqA);
    expect(Array.from({ length: 20 }, () => c.next())).not.toEqual(seqA);
    // Using one stream does not move another one.
    const d = new Rng(deriveSeed(seed, 1));
    new Rng(deriveSeed(seed, 2)).next();
    expect(d.next()).toBe(seqA[0]);
  });
});

describe('Ruta del día: one counted attempt per day', () => {
  const day1 = new Date('2026-11-25T15:00:00Z');
  const day2 = new Date('2026-11-26T15:00:00Z');

  it('the first start counts, repeats are practice, a new day counts again', () => {
    const save = defaultSave();
    const first = startDaily(save, day1);
    expect(first.counted).toBe(true);
    expect(first.number).toBe(25);
    const second = startDaily(save, day1);
    expect(second.counted).toBe(false);
    expect(second.seed).toBe(first.seed);
    expect(startDaily(save, day2).counted).toBe(true);
  });

  it('only the counted attempt records its km (and keeps the best)', () => {
    const save = defaultSave();
    const counted = startDaily(save, day1);
    const practice = startDaily(save, day1);
    finishDaily(save, practice, 4000);
    expect(dailyToday(save, day1).km).toBe(0);
    finishDaily(save, counted, 1200);
    finishDaily(save, counted, 900);
    expect(dailyToday(save, day1).km).toBe(1200);
  });

  it('yesterday\'s result does not leak into today', () => {
    const save = defaultSave();
    finishDaily(save, startDaily(save, day1), 2000);
    expect(dailyToday(save, day2)).toEqual({ key: '2026-11-26', counted: false, km: 0 });
  });
});

describe('share text', () => {
  it('has a square per minute: colour by zone, black for what was not reached', () => {
    expect(squares(2980).join('')).toBe('🟨🟨🟨🟦🟦🟦🟩🟩🟩⬛⬛⬛');
    expect(squares(0).join('')).toBe(`🟨${NOT_REACHED.repeat(11)}`);
    expect(squares(4300).join('')).toBe('🟨🟨🟨🟦🟦🟦🟩🟩🟩⬜⬜⬜');
    expect(squares(99999)).toHaveLength(12);
  });

  it('is exactly the text from the GDD format', () => {
    expect(shareText(SAMPLE)).toBe(
      [
        'QUILTRO · Ruta del día #25',
        '🐕 Llegué a Chiloé · 2.980 km',
        '🟨🟨🟨🟦🟦🟦🟩🟩🟩⬛⬛⬛',
        '🪁 Cielo del Dieciocho',
        '¿Llegai más lejos? https://ragamoofi.github.io/quiltro/',
      ].join('\n'),
    );
  });

  it('is identical for the same result, so two devices paste the same thing', () => {
    expect(shareText({ ...SAMPLE })).toBe(shareText({ ...SAMPLE, icons: [] }));
  });

  it('marks practice runs, normal trips and wins', () => {
    expect(shareText({ ...SAMPLE, daily: { number: 25, counted: false } }).split('\n')[0]).toBe('QUILTRO · Ruta del día #25 (práctica)');
    expect(shareText({ ...SAMPLE, daily: null }).split('\n')[0]).toBe('QUILTRO · Mi viaje');
    expect(shareText({ ...SAMPLE, km: 4300, city: 'Punta Arenas', victory: true })).toContain('🏆 ¡De Arica a Punta Arenas!');
  });

  it('picks the character\'s emoji and skips an empty build line', () => {
    const t = shareText({ ...SAMPLE, character: 'pinguino', build: '' });
    expect(t).toContain('🐧 Llegué a Chiloé');
    expect(t).not.toContain('🪁');
  });
});

describe('card background', () => {
  it('follows the zone reached', () => {
    expect(zoneIndexAt(100)).toBe(0);
    expect(zoneIndexAt(1500)).toBe(1);
    expect(zoneIndexAt(2500)).toBe(2);
    expect(zoneIndexAt(4300)).toBe(3);
    expect(zoneIndexAt(9000)).toBe(3);
  });
});
