import { Container } from 'pixi.js';
import type { RunContext } from '../context.ts';
import { Cables } from './cables.ts';
import { Bolitas } from './bolitas.ts';
import { Chaya } from './chaya.ts';
import { Elastico } from './elastico.ts';
import { Emboque } from './emboque.ts';
import { Fuegos } from './fuegos.ts';
import { Rayuela } from './rayuela.ts';
import { Ronda } from './ronda.ts';
import { Trompo } from './trompo.ts';
import { Volantin } from './volantin.ts';
import { Boleadora, Cacerola, Choripan, Pandero, SopaipillaCaliente } from './barrio.ts';
import type { Weapon } from './weapon.ts';

const FACTORIES: Record<string, () => Weapon> = {
  volantin: () => new Volantin(),
  trompo: () => new Trompo(),
  cables: () => new Cables(),
  chaya: () => new Chaya(),
  fuegos: () => new Fuegos(),
  rayuela: () => new Rayuela(),
  bolitas: () => new Bolitas(),
  emboque: () => new Emboque(),
  elastico: () => new Elastico(),
  ronda: () => new Ronda(),
  choripan: () => new Choripan(),
  pandero: () => new Pandero(),
  cacerola: () => new Cacerola(),
  boleadora: () => new Boleadora(),
  sopaipillaCaliente: () => new SopaipillaCaliente(),
};

/**
 * The weapons in play, kept in sync with the build. The chaya trail goes on
 * the floor layer; everything else flies above the world.
 */
export class WeaponSet {
  readonly root = new Container();
  readonly floor = new Container();
  private readonly active = new Map<string, Weapon>();

  sync(ctx: RunContext): void {
    for (const w of ctx.build.weapons) {
      const id = w.def.id;
      if (this.active.has(id)) continue;
      const make = FACTORIES[id];
      if (!make) continue;
      const weapon = make();
      this.active.set(id, weapon);
      (id === 'chaya' ? this.floor : this.root).addChild(weapon.root);
    }
  }

  get<T extends Weapon>(id: string): T | undefined {
    return this.active.get(id) as T | undefined;
  }

  update(dt: number, ctx: RunContext): void {
    for (const w of this.active.values()) w.update(dt, ctx);
  }

  render(alpha: number, ctx: RunContext): void {
    for (const w of this.active.values()) w.render(alpha, ctx);
  }
}
