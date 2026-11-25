/**
 * Balance bot (only loaded with ?debug). It plays whole trips through the real
 * game code, without drawing, at three skill levels, and reports what happened:
 * how far it got, what killed it, how long the bosses lasted, what each weapon
 * did and which cards it was offered and took. Numbers are for comparing
 * versions of the game (and finding broken weapons or walls), not a replacement
 * for a human playing.
 */
import { Rng } from '../core/rng.ts';
import type { InputState } from '../core/input.ts';
import { ARMAS, MAX_WEAPONS } from '../data/armas.ts';
import { px } from '../data/balance.ts';
import { EVOLUCIONES } from '../data/evoluciones.ts';
import type { Offer } from '../game/build.ts';
import type { Journey } from '../game/journey.ts';
import type { RunScene } from '../game/runScene.ts';

export type Skill = 'novato' | 'medio' | 'experto';

interface SkillConfig {
  /** Frames between decisions (a human does not re-think every frame). */
  react: number;
  /** Distance (px) at which enemies start to feel dangerous. */
  danger: number;
  /** Seconds the bot looks ahead when choosing a direction. */
  lookahead: number;
  /** Radius (px) in which it goes for food. */
  foodRange: number;
  /** Chance per decision of moving at random. */
  noise: number;
  /** Uses ¡GUAU! when surrounded; the number is how many enemies count as surrounded (0 = never). */
  guauCrowd: number;
  /** How much it respects attack warnings (0..1). */
  telegraph: number;
  cards: 'azar' | 'razonable' | 'plan';
}

export const SKILLS: Record<Skill, SkillConfig> = {
  novato: { react: 27, danger: 26, lookahead: 0.3, foodRange: 30, noise: 0.25, guauCrowd: 0, telegraph: 0, cards: 'azar' },
  medio: { react: 12, danger: 38, lookahead: 0.4, foodRange: 110, noise: 0.06, guauCrowd: 6, telegraph: 0.6, cards: 'razonable' },
  experto: { react: 5, danger: 50, lookahead: 0.5, foodRange: 190, noise: 0, guauCrowd: 4, telegraph: 1, cards: 'plan' },
};

/** What the bot needs from the game, given by main.ts. */
export interface BotHooks {
  /** Starts a plain-Quiltro trip with this seed (no Cucha upgrades, nothing saved) and returns it. */
  start(seed: number): RunScene;
  /** Advances the simulation by n frames of 1/60 s without drawing. */
  tick(frames: number): void;
}

/** The private parts of RunScene the bot drives (the real game never calls these from outside). */
interface Internals {
  mode: string;
  offers: Offer[];
  rerolls: number;
  victory: boolean;
  input: { override: InputState | null };
  journey: Journey;
  caja: { tap(): void };
  comic: { next(): void } | null;
  pick(i: number): void;
  reroll(): void;
}

interface Warning {
  kind: 'circle' | 'line';
  x: number;
  y: number;
  r: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  color: string;
}

interface Shot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
}

interface Piece {
  active: boolean;
  kind: string;
  xp: number;
  x: number;
  y: number;
  pulled: boolean;
}

export interface Sample {
  min: number;
  level: number;
  hp: number;
  maxHp: number;
  enemies: number;
  kills: number;
}

export interface BossFight {
  id: string;
  seconds: number;
  won: boolean;
}

export interface RunReport {
  seed: number;
  skill: Skill;
  /** Minutes survived. */
  minutes: number;
  km: number;
  zone: string;
  level: number;
  kills: number;
  won: boolean;
  /** What dealt the last hit ('' if the bot did not die). */
  deathBy: string;
  damageTaken: number;
  damageFrom: Record<string, number>;
  damageBy: Record<string, number>;
  weapons: Record<string, number>;
  traits: Record<string, number>;
  evolved: string[];
  bosses: BossFight[];
  maxEnemies: number;
  timeline: Sample[];
  /** Cards offered / taken, as "kind:id:rarity". */
  offered: Record<string, number>;
  taken: Record<string, number>;
  /** Wall-clock milliseconds per simulated second. */
  msPerSecond: number;
}

const RARITY_ORDER = ['comun', 'rara', 'epica', 'legendaria'];
const RARITY_VALUE = [1, 1.15, 1.3, 1.5];

/** How good a trait is on its own (higher = taken first), before pairing with a weapon. */
const TRAIT_BASE: Record<string, number> = {
  choro: 30,
  alTiro: 28,
  laOnce: 26,
  laJauria: 24,
  cachai: 22,
  chalequito: 20,
  pataDePerro: 18,
  olfato: 12,
};

const cardKey = (o: Offer): string => (o.kind === 'heal' || o.kind === 'lucas' ? `${o.kind}::${o.rarity}` : `${o.kind}:${o.id}:${o.rarity}`);

function bump(map: Record<string, number>, key: string, by = 1): void {
  map[key] = (map[key] ?? 0) + by;
}

/** One trip. */
export async function playRun(hooks: BotHooks, seed: number, skill: Skill, maxMinutes = 16): Promise<RunReport> {
  const cfg = SKILLS[skill];
  const rng = new Rng(seed ^ 0xb07b07);
  const run = hooks.start(seed);
  const I = run as unknown as Internals;
  const ctx = run.ctx;
  const p = ctx.player;
  const t0 = performance.now();
  const st: InputState = { moveX: 0, moveY: 0, hold: false };
  I.input.override = st;

  const offered: Record<string, number> = {};
  const taken: Record<string, number> = {};
  const timeline: Sample[] = [];
  const bosses: BossFight[] = [];
  const plan = new Set<string>([ctx.build.slotWeapons[0]?.def.id ?? 'volantin']);
  let maxEnemies = 0;
  let nextSample = 0;
  let bossStart = -1;
  let bossId = '';
  let dirX = 0;
  let dirY = 0;
  let wantHold = false;
  let framesSinceDecision = cfg.react;
  let rerolledThisSet = false;

  const warnings = (): Warning[] => (ctx.telegraphs as unknown as { list: Warning[] }).list;
  const pieces = (): Piece[] => (ctx.food as unknown as { pool: Piece[] }).pool;

  const decide = (): void => {
    const speed = p.speed;
    const reach = speed * cfg.lookahead;
    if (rng.next() < cfg.noise) {
      const a = rng.range(0, Math.PI * 2);
      dirX = Math.cos(a);
      dirY = Math.sin(a);
      return;
    }
    // The nearest thing worth walking to.
    let goalX = 0;
    let goalY = 0;
    let hasGoal = false;
    let best = cfg.foodRange;
    const hurt = p.hp / p.maxHp < 0.6;
    for (const f of pieces()) {
      if (!f.active || f.pulled) continue;
      let want = f.xp > 0;
      if (f.kind === 'mote' && hurt) want = true;
      if (f.kind === 'caja' || f.kind === 'cajaDorada') want = true;
      if (!want) continue;
      const d = Math.hypot(f.x - p.x, f.y - p.y) - (f.xp >= 25 ? 40 : 0);
      if (d < best) {
        best = d;
        goalX = f.x;
        goalY = f.y;
        hasGoal = true;
      }
    }
    const near: { x: number; y: number; r: number; w: number }[] = [];
    const lookR = cfg.danger + reach + 30;
    for (const e of ctx.enemies.list) {
      if (!e.active || e.harmless) continue;
      if (Math.abs(e.x - p.x) > lookR || Math.abs(e.y - p.y) > lookR) continue;
      near.push({
        x: e.x + e.vx * cfg.lookahead * 0.5,
        y: e.y + e.vy * cfg.lookahead * 0.5,
        r: e.radius,
        w: 1 + e.damage / 12 + (e.boss ? 2 : 0),
      });
    }
    // Enemy projectiles count as small, fast enemies (so spit and waves get dodged).
    for (const s of (ctx.shots as unknown as { pool: Shot[] }).pool) {
      if (!s.active || Math.abs(s.x - p.x) > lookR || Math.abs(s.y - p.y) > lookR) continue;
      near.push({ x: s.x + s.vx * cfg.lookahead, y: s.y + s.vy * cfg.lookahead, r: 3, w: 1 + s.damage / 8 });
    }
    const red = cfg.telegraph > 0 ? warnings().filter((w) => w.color === 'r') : [];
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const cx = Math.cos(a);
      const cy = Math.sin(a);
      const tx = p.x + cx * reach;
      const ty = p.y + cy * reach;
      let risk = 0;
      for (const e of near) {
        const d = Math.hypot(tx - e.x, ty - e.y) - e.r - p.radius;
        if (d < cfg.danger) risk += ((cfg.danger - d) / cfg.danger) ** 2 * e.w;
      }
      for (const w of red) {
        const inside =
          w.kind === 'circle'
            ? Math.hypot(tx - w.x, ty - w.y) < w.r + 10
            : distToSegment(tx, ty, w.x0, w.y0, w.x1, w.y1) < w.width / 2 + 10;
        if (inside) risk += 6 * cfg.telegraph;
      }
      let reward = 0;
      if (hasGoal) {
        const gain = Math.hypot(p.x - goalX, p.y - goalY) - Math.hypot(tx - goalX, ty - goalY);
        reward = (gain / Math.max(1, reach)) * 1.2;
      }
      const score = reward - risk * 3 + 0.15 * (cx * dirX + cy * dirY);
      if (score > bestScore) {
        bestScore = score;
        dirX = cx;
        dirY = cy;
      }
    }
  };

  const crowdAround = (radius: number): number => {
    let n = 0;
    const r2 = radius * radius;
    for (const e of ctx.enemies.list) {
      if (e.active && !e.harmless && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r2) n++;
    }
    return n;
  };

  const chooseCard = (): void => {
    const offers = I.offers;
    for (const o of offers) bump(offered, cardKey(o));
    if (cfg.cards === 'azar') {
      const i = rng.int(0, offers.length - 1);
      const o = offers[i];
      if (o) bump(taken, cardKey(o));
      I.pick(i);
      return;
    }
    const b = ctx.build;
    const hpFrac = p.hp / p.maxHp;
    const scoreOf = (o: Offer): number => {
      let s: number;
      if (o.kind === 'evolution') s = 1000;
      else if (o.kind === 'heal') s = hpFrac < 0.5 ? 45 : 2;
      else if (o.kind === 'lucas') s = 1;
      else if (o.kind === 'weapon') {
        const owned = b.weapon(o.id);
        s = owned ? 30 + 4 * o.toLevel : b.slotWeapons.length < MAX_WEAPONS ? 28 : 0;
        if (o.id === 'guau') s -= 8;
        if (cfg.cards === 'plan') {
          if (plan.has(o.id)) s *= 1.6;
          else if (!owned && plan.size >= 3) s *= 0.2;
        }
      } else {
        const pair = EVOLUCIONES.find((e) => e.trait === o.id)?.weapon;
        const pairOwned = pair !== undefined && !!b.weapon(pair);
        s = (TRAIT_BASE[o.id] ?? 15) + (pairOwned ? 16 : 0) + (b.trait(o.id) ? 6 : 0);
        if (cfg.cards === 'plan' && pair && plan.has(pair)) s *= 1.5;
      }
      return s * (RARITY_VALUE[RARITY_ORDER.indexOf(o.rarity)] ?? 1);
    };
    let bestI = 0;
    let bestS = Number.NEGATIVE_INFINITY;
    offers.forEach((o, i) => {
      const s = scoreOf(o);
      if (s > bestS) {
        bestS = s;
        bestI = i;
      }
    });
    if (cfg.cards === 'plan' && bestS < 24 && I.rerolls > 0 && !rerolledThisSet) {
      rerolledThisSet = true;
      I.reroll();
      chooseCard();
      return;
    }
    const chosen = offers[bestI];
    if (chosen) {
      bump(taken, cardKey(chosen));
      if (chosen.kind === 'weapon' && plan.size < 3) plan.add(chosen.id);
    }
    rerolledThisSet = false;
    I.pick(bestI);
  };

  // Yield to the browser now and then (a MessageChannel is not throttled in hidden tabs).
  const channel = new MessageChannel();
  const yieldNow = (): Promise<void> =>
    new Promise((resolve) => {
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(0);
    });
  let lastYield = performance.now();

  while (I.mode !== 'end' && ctx.time < maxMinutes * 60 && performance.now() - t0 < 180_000) {
    const mode = I.mode;
    if (mode === 'cards') {
      chooseCard();
    } else if (mode === 'caja') {
      I.caja.tap();
    } else if (mode === 'comic') {
      I.comic?.next();
    }
    if (I.mode === 'cards' || I.mode === 'caja' || I.mode === 'comic') {
      // Menus use the real clock; let frames pass so they can finish.
      hooks.tick(1);
    } else {
      if (framesSinceDecision >= cfg.react) {
        framesSinceDecision = 0;
        decide();
        if (cfg.guauCrowd > 0 && p.guauReady && !wantHold && crowdAround(px(90)) >= cfg.guauCrowd) wantHold = true;
      }
      framesSinceDecision++;
      if (wantHold && (p.charge >= 1 || !p.guauReady)) wantHold = false;
      st.moveX = p.dead ? 0 : dirX;
      st.moveY = p.dead ? 0 : dirY;
      st.hold = wantHold;
      hooks.tick(1);
    }

    maxEnemies = Math.max(maxEnemies, ctx.enemies.activeCount);
    if (ctx.time >= nextSample) {
      nextSample += 60;
      timeline.push({
        min: Math.round(ctx.time / 60),
        level: ctx.progress.level,
        hp: Math.round(p.hp),
        maxHp: Math.round(p.maxHp),
        enemies: ctx.enemies.activeCount,
        kills: ctx.stats.kills,
      });
    }
    const boss = I.journey.boss;
    if (boss && bossStart < 0) {
      bossStart = ctx.time;
      bossId = I.journey.zone.boss ?? 'jefe';
    } else if (!boss && bossStart >= 0) {
      bosses.push({ id: bossId, seconds: Math.round(ctx.time - bossStart), won: ctx.stats.bossesBeaten.includes(bossId) });
      bossStart = -1;
    }
    if (performance.now() - lastYield > 80) {
      lastYield = performance.now();
      await yieldNow();
    }
  }
  if (bossStart >= 0) bosses.push({ id: bossId, seconds: Math.round(ctx.time - bossStart), won: false });
  I.input.override = null;

  const km = I.journey.km(ctx.time);
  return {
    seed,
    skill,
    minutes: Math.round((ctx.time / 60) * 100) / 100,
    km: Math.round(km),
    zone: I.journey.zone.id,
    level: ctx.progress.level,
    kills: ctx.stats.kills,
    won: I.victory,
    deathBy: p.dead ? ctx.stats.lastHit : '',
    damageTaken: Math.round(ctx.stats.damageTaken),
    damageFrom: roundAll(ctx.stats.damageFrom),
    damageBy: roundAll(ctx.stats.damageBy),
    weapons: Object.fromEntries(ctx.build.weapons.map((w) => [w.def.id, w.level])),
    traits: Object.fromEntries(ctx.build.traits.map((t) => [t.def.id, t.level])),
    evolved: [...ctx.build.evolved],
    bosses,
    maxEnemies,
    timeline,
    offered,
    taken,
    msPerSecond: Math.round(((performance.now() - t0) / Math.max(1, ctx.time)) * 10) / 10,
  };
}

function roundAll(m: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.round(v)]));
}

function distToSegment(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
  return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
}

/** Zone → share of deaths, average minute, and so on, from a batch of reports. */
export function summarize(reports: readonly RunReport[]): Record<string, unknown> {
  const n = reports.length || 1;
  const avg = (f: (r: RunReport) => number): number => Math.round((reports.reduce((a, r) => a + f(r), 0) / n) * 100) / 100;
  const deathsByZone: Record<string, number> = {};
  const deathsBy: Record<string, number> = {};
  const reached: Record<string, number> = {};
  const weaponDps: Record<string, { damage: number; runs: number }> = {};
  const bossSeconds: Record<string, number[]> = {};
  const offered: Record<string, number> = {};
  const taken: Record<string, number> = {};
  for (const r of reports) {
    if (!r.won) bump(deathsByZone, r.zone);
    if (r.deathBy) bump(deathsBy, r.deathBy);
    for (const z of ['norte', 'centro', 'sur', 'patagonia']) {
      if (r.minutes >= (ZONE_START[z] ?? 0)) bump(reached, z);
    }
    for (const [id, dmg] of Object.entries(r.damageBy)) {
      const w = (weaponDps[id] ??= { damage: 0, runs: 0 });
      w.damage += dmg / Math.max(1, r.minutes);
      w.runs++;
    }
    for (const b of r.bosses) (bossSeconds[b.id] ??= []).push(b.seconds);
    for (const [k, v] of Object.entries(r.offered)) bump(offered, k, v);
    for (const [k, v] of Object.entries(r.taken)) bump(taken, k, v);
  }
  return {
    runs: reports.length,
    skill: reports[0]?.skill,
    won: reports.filter((r) => r.won).length / n,
    minutes: avg((r) => r.minutes),
    km: avg((r) => r.km),
    level: avg((r) => r.level),
    kills: avg((r) => r.kills),
    reached: Object.fromEntries(Object.entries(reached).map(([k, v]) => [k, Math.round((v / n) * 100) / 100])),
    deathsByZone,
    deathsBy,
    damageByPerMinute: Object.fromEntries(
      Object.entries(weaponDps).map(([k, v]) => [k, { perMinute: Math.round(v.damage / v.runs), runsUsed: v.runs }]),
    ),
    bossSeconds,
    pickRate: Object.fromEntries(
      Object.entries(offered)
        .filter(([, o]) => o >= 5)
        .map(([k, o]) => [k, Math.round(((taken[k] ?? 0) / o) * 100) / 100]),
    ),
    maxEnemies: Math.max(...reports.map((r) => r.maxEnemies), 0),
    msPerSecond: avg((r) => r.msPerSecond),
  };
}

const ZONE_START: Record<string, number> = { norte: 0, centro: 3, sur: 6, patagonia: 9 };

/** Weapon ids, for the tests that check the data the bot relies on. */
export const WEAPON_IDS = ARMAS.map((a) => a.id);
