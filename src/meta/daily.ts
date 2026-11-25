import { seedFromString } from '../core/rng.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { TOTAL_KM, ZONAS } from '../data/zonas.ts';
import type { SaveData } from './save.ts';

/**
 * Ruta del día (GDD "Ruta del día"): one trip with a fixed seed per date, the
 * same enemies and cards for everyone, one counted attempt per day, and a
 * short text to paste into the family WhatsApp group (like Wordle).
 *
 * The date is always Chile's (America/Santiago), so a player abroad gets the
 * same route on the same day as everyone else. Pure functions: the tests pin
 * the text down to the character.
 */
export const DAILY_EPOCH = '2026-11-01';
export const DAILY_TIMEZONE = 'America/Santiago';

/** Chile's calendar date as 'YYYY-MM-DD'. */
export function dailyKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const dayIndex = (key: string): number => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

/** Route number: 1 on the epoch day, +1 every day. */
export function dailyNumber(key: string): number {
  return dayIndex(key) - dayIndex(DAILY_EPOCH) + 1;
}

/** The run seed for a date: identical on every device. */
export function dailySeed(key: string): number {
  return seedFromString(`quiltro-ruta-del-dia-${key}`);
}

// ---------------------------------------------------------------- the state

export interface DailyState {
  /** Date of the last daily started. */
  key: string;
  /** The counted attempt of that date was already used. */
  counted: boolean;
  /** Best km of the counted attempt (0 until it ends). */
  km: number;
}

/** Today's state; a new day starts fresh. */
export function dailyToday(save: SaveData, now: Date = new Date()): DailyState {
  const key = dailyKey(now);
  return save.daily.key === key ? save.daily : { key, counted: false, km: 0 };
}

export interface DailyRun {
  key: string;
  number: number;
  seed: number;
  /** False for repeats of the same route ("se puede repetir sin puntuar"). */
  counted: boolean;
}

/** Starts today's route; the first start of the day is the counted one. */
export function startDaily(save: SaveData, now: Date = new Date()): DailyRun {
  const today = dailyToday(save, now);
  const counted = !today.counted;
  // The attempt is spent when it starts, so closing the page cannot reroll it.
  if (counted) save.daily = { key: today.key, counted: true, km: 0 };
  else save.daily = today;
  return { key: today.key, number: dailyNumber(today.key), seed: dailySeed(today.key), counted };
}

/** Records the km of a finished counted attempt. */
export function finishDaily(save: SaveData, run: DailyRun, km: number): void {
  if (run.counted && save.daily.key === run.key) save.daily.km = Math.max(save.daily.km, km);
}

// ---------------------------------------------------------------- the text

export const SQUARE_COUNT = 12;
/** Norte, Centro, Sur, Patagonia: three squares (minutes) each; ⬛ = not reached. */
const ZONE_SQUARES = ['🟨', '🟦', '🟩', '⬜'] as const;
export const NOT_REACHED = '⬛';

/** The 12 squares of the share text: one per minute of the trip. */
export function squares(km: number): string[] {
  const per = TOTAL_KM / SQUARE_COUNT;
  const reached = Math.min(SQUARE_COUNT, Math.max(1, Math.floor(km / per) + 1));
  return Array.from({ length: SQUARE_COUNT }, (_, i) =>
    i < reached ? (ZONE_SQUARES[Math.min(3, Math.floor(i / 3))] ?? NOT_REACHED) : NOT_REACHED,
  );
}

/** Which zone colour each of the 12 squares has, for the image card (palette chars). */
export const ZONE_COLORS = ['y', 'b', 'v', 'W'] as const;

const CHARACTER_EMOJI: Readonly<Record<string, string>> = {
  quiltro: '🐕',
  quiltra: '🐕',
  gato: '🐈',
  pudu: '🦌',
  pinguino: '🐧',
  paloma: '🕊️',
};

export interface ShareInfo {
  km: number;
  /** City name already translated ("Chiloé"). */
  city: string;
  /** What defined the build: an evolution or the strongest weapon ("Cielo del Dieciocho"). */
  build: string;
  /** Weapon and trait icon ids for the image card. */
  icons: string[];
  character: string;
  /** Ruta del día data; null for a normal trip. */
  daily: { number: number; counted: boolean } | null;
  victory: boolean;
  /** Public address of the game. */
  link: string;
}

/** The text to paste into the group. Stable: the tests compare it character by character. */
export function shareText(info: ShareInfo): string {
  const title = info.daily
    ? t(info.daily.counted ? 'compartir.titulo' : 'compartir.tituloPractica', { n: info.daily.number })
    : t('compartir.tituloViaje');
  const lines = [
    title,
    `${CHARACTER_EMOJI[info.character] ?? '🐕'} ${t('compartir.llegue', { lugar: info.city, km: formatNumber(info.km) })}`,
    squares(info.km).join(''),
  ];
  if (info.victory) lines.push(t('compartir.victoria'));
  if (info.build) lines.push(`🪁 ${info.build}`);
  lines.push(t('compartir.invitacion', { link: info.link }));
  return lines.join('\n');
}

/** Zone a km belongs to (for the card background). */
export function zoneIndexAt(km: number): number {
  const per = TOTAL_KM / 4;
  return Math.min(ZONAS.length - 2, Math.floor(km / per));
}
