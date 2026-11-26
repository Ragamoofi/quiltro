import type { RunContext } from './context.ts';
import type { Loadout } from './loadout.ts';

export interface Checkpoint {
  seed: number;
  loadout: Loadout;
  zone: number;
  time: number;
  hp: number;
  rerolls: number;
  banishes: number;
  progress: RunContext['progress'];
  stats: RunContext['stats'];
  weapons: RunContext['build']['weapons'];
  traits: RunContext['build']['traits'];
  evolved: string[];
  banished: string[];
  relics: number[];
  rng: [number, number, number];
}

const KEY = 'quiltro.checkpoint.v1';

export function readCheckpoint(): Checkpoint | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Checkpoint;
    if (!Number.isInteger(value.zone) || value.zone < 0 || value.zone > 3 || !Number.isFinite(value.time)
      || !Number.isFinite(value.hp) || !value.loadout?.character || !value.stats || !value.progress
      || !Array.isArray(value.evolved) || !Array.isArray(value.banished) || !Array.isArray(value.relics) || !Array.isArray(value.weapons) || !Array.isArray(value.traits) || value.rng?.length !== 3) return null;
    return value;
  } catch {
    return null;
  }
}

export function storeCheckpoint(value: Checkpoint | null): void {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable in private browsing.
  }
}
