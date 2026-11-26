import type { RunContext } from '../context.ts';

export const RELICS = [
  { name: 'Cascabel rajado', description: 'Los críticos provocan una onda cerca del impacto.' },
  { name: 'Frazada de feria', description: 'Acumula 30 puntos de sobrecuración para ganar un escudo.' },
  { name: 'Bolsa de papel', description: 'Cada 12 comidas recogidas disparas una onda.' },
  { name: 'Hilo encerado', description: 'Tu grito cargado potencia el próximo golpe de arma.' },
  { name: 'Espejito de micro', description: 'Pasar justo al lado de un proyectil genera una onda.' },
  { name: 'Moneda del vuelto', description: 'Tras abrir un cofre, recoge el vuelto antes de 7 s.' },
] as const;

export const REGIONAL_TRIALS: Readonly<Record<string, { name: string; seconds: number; kills: number; radius: number }>> = {
  norte: { name: 'Puesto del desierto', seconds: 18, kills: 12, radius: 140 },
  centro: { name: 'Feria en hora punta', seconds: 20, kills: 16, radius: 125 },
  sur: { name: 'Fogón del sur', seconds: 24, kills: 14, radius: 105 },
  patagonia: { name: 'Puesto del ventisquero', seconds: 26, kills: 18, radius: 115 },
};

export class FairChallenge {
  readonly owned = new Set<number>();
  private trial: { x: number; y: number; remaining: number; kills: number; target: number; radius: number } | undefined;
  choices: readonly number[] = [];

  get boundary(): Readonly<{ x: number; y: number; radius: number }> | undefined { return this.trial; }
  get coin(): Readonly<{ x: number; y: number }> | undefined { return this.change; }

  progress(kills: number, x: number, y: number, time: number): string {
    if (!this.trial) {
      if (this.choices.length) return 'Elige una reliquia';
      if (!this.change) return '';
      const dx = this.change.x - x;
      const dy = this.change.y - y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'derecha' : 'izquierda') : (dy > 0 ? 'abajo' : 'arriba');
      return 'Vuelto: ' + dir + ' · ' + Math.ceil(this.change.expires - time) + ' s';
    }
    return 'Feria: ' + Math.min(this.trial.target, kills - this.trial.kills) + '/' + this.trial.target + ' · ' + Math.ceil(this.trial.remaining) + ' s';
  }

  choose(id: number, ctx: RunContext): void {
    const relic = RELICS[id];
    if (!relic || !this.choices.includes(id) || ctx.player.dead) return;
    this.choices = [];
    this.owned.add(id);
    if (id === 2) this.food = ctx.stats.food;
    ctx.banner(relic.name, 'a', relic.description);
    ctx.sfx.play('campana');
  }

  private empowered = false;
  private nextMirror = 0;
  private change: { x: number; y: number; expires: number } | undefined;

  chargeWeapon(): void {
    if (this.owned.has(3)) this.empowered = true;
  }

  weaponMultiplier(source: string): number {
    if (!this.empowered || source === 'guau') return 1;
    this.empowered = false;
    return 1.5;
  }

  nearMiss(ctx: RunContext): void {
    if (!this.owned.has(4) || ctx.time < this.nextMirror) return;
    this.nextMirror = ctx.time + 5;
    ctx.enemies.shockwave(ctx.player.x, ctx.player.y - 8, 45, 15, ctx);
  }

  chestOpened(ctx: RunContext, x: number, y: number): void {
    if (!this.owned.has(5)) return;
    this.change = { x: x + 55, y, expires: ctx.time + 7 };
    ctx.banner('Moneda del vuelto', 'a', 'Busca el vuelto a la derecha del cofre.');
  }

  private nextPulse = 0;
  private overflow = 0;
  private food = 0;
  private critical: { x: number; y: number } | undefined;

  start(ctx: RunContext, zone = 'norte', x = ctx.player.x, y = ctx.player.y): void {
    if (this.trial || this.choices.length || this.owned.size === RELICS.length) return;
    const rule = REGIONAL_TRIALS[zone] ?? REGIONAL_TRIALS.norte!;
    this.trial = { x, y, remaining: rule.seconds, kills: ctx.stats.kills, target: rule.kills, radius: rule.radius };
    ctx.banner(rule.name, 'a', 'Derrota ' + rule.kills + ' enemigos en ' + rule.seconds + ' s cerca del puesto.');
  }

  overheal(amount: number, ctx: RunContext): void {
    if (!this.owned.has(1) || ctx.player.shield) return;
    this.overflow += amount;
    if (this.overflow >= 30) {
      this.overflow = 0;
      ctx.player.shield = true;
    }
  }

  onCritical(x: number, y: number, time: number): void {
    if (!this.owned.has(0) || time < this.nextPulse) return;
    this.nextPulse = time + 1.5;
    this.critical = { x, y };
  }

  update(dt: number, ctx: RunContext, boss: boolean): void {
    if (ctx.player.dead) return;
    const change = this.change;
    if (change && ctx.time >= change.expires) this.change = undefined;
    else if (change && Math.hypot(ctx.player.x - change.x, ctx.player.y - change.y) <= 16) {
      this.change = undefined;
      ctx.progress.lucas += 15;
      ctx.banner('+15 lucas de vuelto', 'a');
    }
    const pulse = this.critical;
    this.critical = undefined;
    if (pulse) ctx.enemies.shockwave(pulse.x, pulse.y, 36, 12, ctx);
    if (this.owned.has(2) && ctx.stats.food - this.food >= 12) {
      this.food += 12;
      ctx.enemies.shockwave(ctx.player.x, ctx.player.y - 8, 52, 18, ctx);
    }
    const trial = this.trial;
    if (!trial) return;
    trial.remaining -= dt;
    if (boss || trial.remaining <= 0 || Math.hypot(ctx.player.x - trial.x, ctx.player.y - trial.y) > trial.radius) {
      this.trial = undefined;
      ctx.banner('Desafío de feria perdido', 'w');
    } else if (ctx.stats.kills - trial.kills >= trial.target) {
      this.trial = undefined;
      this.choices = RELICS.map((_, id) => id).filter(id => !this.owned.has(id)).slice(0, 3);
    }
  }
}
