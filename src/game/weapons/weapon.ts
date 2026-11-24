import type { Container } from 'pixi.js';
import type { RunContext } from '../context.ts';

/** A weapon the dog carries. Reads its numbers from the build every update. */
export interface Weapon {
  readonly id: string;
  readonly root: Container;
  update(dt: number, ctx: RunContext): void;
  render(alpha: number, ctx: RunContext): void;
}

/** Fires every `cooldown` seconds; returns how many shots are due this step. */
export class Cooldown {
  private t = 0.3;

  tick(dt: number, cooldown: number): boolean {
    this.t -= dt;
    if (this.t > 0) return false;
    this.t += Math.max(0.05, cooldown);
    if (this.t < 0) this.t = 0;
    return true;
  }
}
