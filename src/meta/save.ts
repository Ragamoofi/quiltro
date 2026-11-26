/**
 * Versioned save in localStorage (GDD "Reglas de ingeniería"): migrations from
 * older versions, a backup copy of the previous save, and export/import as a
 * text code for the Opciones screen. Pure data + functions; no rendering.
 */
export const SAVE_VERSION = 5;

/** Player options (GDD "Opciones"). */
export interface Settings {
  music: number;
  sfx: number;
  /** Screen shake 0..1. */
  shake: number;
  damageNumbers: boolean;
  /** Photosensitivity: no inverted frames, no blackout flashes. */
  reduceFlashes: boolean;
  /** Colour-blind mode: danger/safety also shown with shapes. */
  colorblind: boolean;
  /** 'mantener' = hold to give line; 'alternar' = tap to toggle. */
  holdMode: 'mantener' | 'alternar';
  /** Touch joystick: appears where you touch, or fixed in the corner. */
  joystick: 'flotante' | 'fijo';
  quality: 'auto' | 'alta' | 'baja';
  language: string;
  /** Show the tutorial tips. */
  tips: boolean;
}

/** Whether the device asks for less motion (accessibility setting of the system). */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function defaultSettings(): Settings {
  const calm = prefersReducedMotion();
  return {
    music: 0.6,
    sfx: 0.7,
    shake: calm ? 0.3 : 1,
    damageNumbers: true,
    reduceFlashes: calm,
    colorblind: false,
    holdMode: 'mantener',
    joystick: 'flotante',
    quality: 'auto',
    language: 'es-CL',
    tips: true,
  };
}
const KEY = 'quiltro.save';
const BACKUP_KEY = 'quiltro.save.bak';

export interface TripRecord {
  character: string;
  km: number;
  seconds: number;
  pasaje: number;
  weapons: string[];
  evolutions: string[];
  relics: number[];
  deathBy: string;
}

export interface SaveData {
  history?: TripRecord[];
  claimedObjectives?: string[];
  version: number;
  lucas: number;
  /** Upgrade id → level bought. */
  upgrades: Record<string, number>;
  /** Neighbours befriended (the corner shop lady is there from the start). */
  vecinos: string[];
  characters: string[];
  character: string;
  achievements: string[];
  /** Palette char of the bandana colour chosen (unlocked by achievements). */
  bandana: string;
  totals: { runs: number; kills: number; sopaipillas: number; palomas: number; lucasEarned: number };
  best: { km: number; city: string };
  /** Zones reached at least once (first time pays +100 lucas). */
  zonesReached: string[];
  bossesBeaten: string[];
  antartica: boolean;
  /** Epoch ms of the last time the game was open (for the neighbours). */
  lastSeen: number;
  /** Best lucas earned in one run (caps the neighbours to 30 % of it). */
  bestRunLucas: number;
  settings: Settings;
  /** Tutorial tips already shown (each appears once). */
  tipsShown: string[];
  introSeen: boolean;
  /** Ruta del día: the last date played, whether its counted attempt is used, and its km. */
  daily: { key: string; counted: boolean; km: number };
  /** Fase 11.2: what the dog has met. Enemies beaten (count), weapons ever used and evolutions ever seen. */
  bestiary: { kills: Record<string, number>; weapons: string[]; evolutions: string[] };
  /** Fase 11.6: pasajes cleared (0 to 3) and the one chosen for the next trip (index). */
  pasajesGanados: number;
  pasaje: number;
  /** Fase 11.7: trips per character and deaths per cause, for the statistics tab. */
  stats: { characters: Record<string, number>; deaths: Record<string, number> };
}

export function defaultSave(now = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    lucas: 0,
    upgrades: {},
    vecinos: ['almacen'],
    characters: ['quiltro'],
    character: 'quiltro',
    achievements: [],
    bandana: 'b',
    totals: { runs: 0, kills: 0, sopaipillas: 0, palomas: 0, lucasEarned: 0 },
    best: { km: 0, city: 'arica' },
    zonesReached: [],
    bossesBeaten: [],
    antartica: false,
    lastSeen: now,
    bestRunLucas: 0,
    settings: defaultSettings(),
    tipsShown: [],
    introSeen: false,
    daily: { key: '', counted: false, km: 0 },
    bestiary: { kills: {}, weapons: [], evolutions: [] },
    pasajesGanados: 0,
    pasaje: 0,
    stats: { characters: {}, deaths: {} },
  };
}

type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/** migrations[n] turns a version-n save into version n+1. */
const MIGRATIONS: Record<number, Migration> = {
  // v0 = anything without a version (never shipped; kept as the pattern for the future).
  0: (old) => ({ ...defaultSave(), ...old, version: 1 }),
  // v2 (Phase 5): options, tutorial tips and the intro. Players with runs already saw the game.
  1: (old) => {
    const runs = ((old.totals as { runs?: number } | undefined)?.runs ?? 0) > 0;
    return { ...old, settings: defaultSettings(), tipsShown: [], introSeen: runs, version: 2 };
  },
  // v3 (Phase 7): Ruta del día.
  2: (old) => ({ ...old, daily: { key: '', counted: false, km: 0 }, version: 3 }),
  // v4 (Fase 11.2): the bestiary starts from what the totals already say.
  3: (old) => ({ ...old, bestiary: { kills: {}, weapons: [], evolutions: [] }, version: 4 }),
  // v5 (Fase 11.6): pasajes. Whoever already unlocked La Antártica has won the normal one.
  4: (old) => ({ ...old, pasajesGanados: old.antartica === true ? 1 : 0, pasaje: 0, stats: { characters: {}, deaths: {} }, version: 5 }),
};

/** Brings any old save up to date and fills missing fields with defaults. */
export function migrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return defaultSave();
  let data = raw as Record<string, unknown>;
  let v = typeof data.version === 'number' ? data.version : 0;
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) break;
    data = step(data);
    v = typeof data.version === 'number' ? data.version : v + 1;
  }
  const base = defaultSave();
  const merged = { ...base, ...data } as SaveData;
  merged.totals = { ...base.totals, ...(data.totals as object | undefined) };
  merged.best = { ...base.best, ...(data.best as object | undefined) };
  merged.settings = { ...base.settings, ...(data.settings as object | undefined) };
  merged.daily = { ...base.daily, ...(data.daily as object | undefined) };
  merged.bestiary = { ...base.bestiary, ...(data.bestiary as object | undefined) };
  merged.version = SAVE_VERSION;
  if (!merged.characters.includes('quiltro')) merged.characters.unshift('quiltro');
  if (!merged.vecinos.includes('almacen')) merged.vecinos.unshift('almacen');
  return merged;
}

/** Minimal storage interface so tests can use a fake. */
export interface Store {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safeStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function load(store: Store | null = safeStore()): SaveData {
  if (!store) return defaultSave();
  for (const key of [KEY, BACKUP_KEY]) {
    const text = store.getItem(key);
    if (!text) continue;
    try {
      return migrate(JSON.parse(text));
    } catch {
      // Corrupted: try the backup.
    }
  }
  return defaultSave();
}

export function save(data: SaveData, store: Store | null = safeStore()): void {
  if (!store) return;
  const previous = store.getItem(KEY);
  if (previous) store.setItem(BACKUP_KEY, previous);
  store.setItem(KEY, JSON.stringify(data));
}

export function wipe(store: Store | null = safeStore()): void {
  store?.removeItem(KEY);
  store?.removeItem(BACKUP_KEY);
}

/** Small checksum so a mistyped code is rejected instead of half-loaded. */
function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

const toBase64 = (s: string): string => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const fromBase64 = (s: string): string => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));

/** Text code to copy into another device. */
export function exportCode(data: SaveData): string {
  const json = JSON.stringify(data);
  return `QUILTRO-${checksum(json)}-${toBase64(json)}`;
}

/** Parses an export code; null if it is not valid. */
export function importCode(code: string): SaveData | null {
  const m = /^QUILTRO-([0-9a-z]+)-(.+)$/.exec(code.trim());
  if (!m || !m[1] || !m[2]) return null;
  try {
    const json = fromBase64(m[2]);
    if (checksum(json) !== m[1]) return null;
    return migrate(JSON.parse(json));
  } catch {
    return null;
  }
}
