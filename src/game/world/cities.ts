import { px } from '../../data/balance.ts';
import { CIUDAD_AVISO_KM, CIUDAD_VENTANA, ESCENARIOS, type CityEvent, type CityScene } from '../../data/escenarios.ts';
import { CIUDADES } from '../../data/zonas.ts';
import { t } from '../../i18n/index.ts';
import type { RunContext } from '../context.ts';

export interface CityView {
  scene: CityScene;
  /** 0 when the landmark enters the screen, 1 when it leaves. */
  progress: number;
}

/**
 * The scenery and small events of each city (see data/escenarios.ts). It only reads the
 * kilometre counter, so it works the same in every run, daily or not.
 */
export class Cities {
  private readonly fired = new Set<string>();
  private pending: { at: number; run: () => void }[] = [];
  private clock = 0;

  /** The city whose scenery is on screen at this km, if any. */
  view(km: number): CityView | null {
    for (const scene of ESCENARIOS) {
      const city = CIUDADES.find((c) => c.id === scene.id);
      if (!city) continue;
      const from = city.km - CIUDAD_VENTANA.antes;
      const to = city.km + CIUDAD_VENTANA.despues;
      if (km >= from && km <= to) return { scene, progress: (km - from) / (to - from) };
    }
    return null;
  }

  /** Fires each city's cartel and event once, when the trip reaches it (never during a boss). */
  update(dt: number, ctx: RunContext, km: number, bossActive: boolean): void {
    this.clock += dt;
    for (const job of this.pending) if (this.clock >= job.at) job.run();
    this.pending = this.pending.filter((j) => this.clock < j.at);
    if (bossActive || ctx.player.dead) return;
    for (const scene of ESCENARIOS) {
      if (this.fired.has(scene.id)) continue;
      const city = CIUDADES.find((c) => c.id === scene.id);
      if (!city || km < city.km - CIUDAD_AVISO_KM) continue;
      this.fired.add(scene.id);
      // The starting city has no cartel: the zone's title is already on screen.
      if (city.km > 0) ctx.banner(t(city.i18n), 'w', t(`ciudadesLinea.${scene.id}`));
      if (scene.event) this.run(scene.event, ctx);
    }
  }

  private run(event: CityEvent, ctx: RunContext): void {
    const p = ctx.player;
    switch (event) {
      case 'brisa':
        for (const dx of [-26, 26]) ctx.food.drop('mote', p.x + dx, p.y - 12, ctx);
        break;
      case 'curanto':
        for (const dx of [-30, 0, 30]) ctx.food.drop('mote', p.x + dx, p.y - 14, ctx);
        break;
      case 'lluvia':
        ctx.food.dropValue(50 + ctx.progress.level * 4, p.x, p.y - 20, ctx, 70);
        break;
      case 'pincoya':
        ctx.food.drop('caja', p.x + 34, p.y - 12, ctx);
        break;
      case 'escudo':
        p.shield = true;
        ctx.particles.burst(ctx.rng, p.x, p.y - 10, 14, ['T', 't', 'W'], 70, 0.45);
        break;
      case 'cerros':
        // The dogs of the hills answer: four barks around the dog, half a second apart.
        for (let i = 0; i < 4; i++) {
          this.pending.push({
            at: this.clock + i * 0.5,
            run: () => {
              if (p.dead) return;
              ctx.enemies.shockwave(p.x, p.y - 8, px(120), 30 + ctx.progress.level, ctx);
              ctx.screen.guau(p.x, p.y, px(120));
              ctx.sfx.play('guau', { pitch: 0.7 + i * 0.12, gain: 0.7 });
              ctx.particles.burst(ctx.rng, p.x, p.y - 10, 10, ['y', 'p', 't', 'W'], 90, 0.4);
            },
          });
        }
        break;
    }
  }
}
