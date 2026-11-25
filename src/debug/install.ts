import type { Application } from 'pixi.js';
import type { AudioEngine } from '../audio/engine.ts';
import type { Music } from '../audio/music.ts';
import { PRIORITY, type Sfx, type SoundId } from '../audio/sfx.ts';
import { SET_IDS, type SetId } from '../audio/musicData.ts';
import type { DisplayFit } from '../core/display.ts';
import type { GameLoop } from '../core/loop.ts';
import type { SceneManager } from '../core/scene.ts';
import { ARMAS } from '../data/armas.ts';
import { spawnPerSecond, TUNING, xpToNext } from '../data/balance.ts';
import { EVOLUCIONES } from '../data/evoluciones.ts';
import { JEFES } from '../data/jefes.ts';
import { PERSONAJES } from '../data/personajes.ts';
import { RASGOS } from '../data/rasgos.ts';
import type { RunScene } from '../game/runScene.ts';
import type { Volantin } from '../game/weapons/volantin.ts';
import { buy as buyUpgrade } from '../meta/progress.ts';
import { exportCode, importCode, type SaveData } from '../meta/save.ts';
import { dailyKey, dailyNumber, type ShareInfo } from '../meta/daily.ts';
import type { DebugPanel } from './panel.ts';

/** Everything the debug panel and the ?debug test hooks need from main.ts. */
export interface DebugEnv {
  debug: DebugPanel;
  app: Application;
  loop: GameLoop;
  scenes: SceneManager;
  engine: AudioEngine;
  music: Music;
  sfx: Sfx;
  data: SaveData;
  run: () => RunScene;
  fit: () => DisplayFit;
  startBotRun: (seed: number, character?: string) => RunScene;
  restart: () => void;
  goCucha: () => void;
  goDaily: () => void;
  persist: () => void;
  wipeAll: () => void;
  renderCard: (info: ShareInfo) => Promise<Blob>;
}

/** The F1 panel (stats, buttons, sliders) and the window hooks used by the balance bot and the tests. */
export async function installDebug(env: DebugEnv): Promise<void> {
  const { debug, app, loop, scenes, engine, music, sfx, data, restart, goCucha, goDaily, persist, wipeAll, renderCard } = env;
  // ---- Debug panel (F1) ----
  const ctx = (): RunScene['ctx'] => env.run().ctx;
  debug.stat('Rendimiento', 'fps', () => String(loop.fps));
  debug.stat('Rendimiento', 'actualizaciones/s', () => String(loop.ups));
  debug.stat('Rendimiento', 'enemigos', () => String(ctx().enemies.activeCount));
  debug.stat('Pantalla', 'resolución', () => `${env.fit().width}×${env.fit().height} ×${env.fit().scale}${env.fit().portrait ? ' (vertical)' : ''}`);
  debug.stat('Partida', 'tiempo', () => `${Math.floor(ctx().time / 60)}:${String(Math.floor(ctx().time % 60)).padStart(2, '0')}`);
  debug.stat('Partida', 'tasa de aparición', () => `${spawnPerSecond(ctx().time / 60).toFixed(2)}/s`);
  debug.stat('Partida', 'muertes / comida', () => `${ctx().stats.kills} / ${ctx().stats.food}`);
  debug.toggleControl('Partida', 'Invencible', () => ctx().debug.invincible, (v) => {
    ctx().debug.invincible = v;
  });
  debug.toggleControl('Partida', 'Aparecen enemigos', () => env.run().spawner.enabled, (v) => {
    env.run().spawner.enabled = v;
  });
  debug.button('Partida', '+50 zancudos', () => {
    const c = ctx();
    for (let i = 0; i < 50; i++) {
      const a = c.rng.range(0, Math.PI * 2);
      c.enemies.spawn('zancudo', c.player.x + Math.cos(a) * 200, c.player.y + Math.sin(a) * 140, c.time / 60, c);
    }
  });
  debug.button('Partida', 'Bandada', () => env.run().spawner.flock(ctx(), env.fit().width, env.fit().height));
  debug.button('Partida', '¡Te rodearon!', () => env.run().spawner.ring(ctx(), 30));
  debug.button('Partida', 'Saltar +1 min', () => {
    ctx().time += 60;
  });
  debug.button('Partida', '+1 nivel', () => {
    ctx().progress.xp += xpToNext(ctx().progress.level);
  });
  debug.button('Partida', 'Élite', () => {
    const c = ctx();
    c.enemies.spawn('zancudo', c.player.x + 120, c.player.y, c.time / 60, c, true);
  });
  debug.button('Partida', 'Caja', () => ctx().food.drop('caja', ctx().player.x + 30, ctx().player.y, ctx()));
  debug.button('Partida', 'Temblor', () => ctx().food.drop('temblor', ctx().player.x + 30, ctx().player.y, ctx()));
  debug.button('Partida', 'Reiniciar', () => restart());
  debug.stat('Progreso', 'lucas / viajes', () => `${data.lucas} / ${data.totals.runs}`);
  debug.button('Progreso', '+1000 lucas', () => {
    data.lucas += 1000;
    persist();
  });
  debug.button('Progreso', 'La Cucha', () => goCucha());
  debug.stat('Ruta del día', 'hoy (Chile)', () => `${dailyKey()} · #${dailyNumber(dailyKey())}`);
  debug.stat('Ruta del día', 'intento', () => (data.daily.key === dailyKey() && data.daily.counted ? `usado (${data.daily.km} km)` : 'disponible'));
  debug.button('Ruta del día', 'Iniciar la ruta', () => goDaily());
  debug.button('Ruta del día', 'Devolver el intento de hoy', () => {
    data.daily = { key: '', counted: false, km: 0 };
    persist();
  });
  debug.button('Progreso', 'Desbloquear todo', () => {
    data.characters = PERSONAJES.map((p) => p.id);
    persist();
  });
  debug.button('Progreso', 'Exportar', () => {
    window.prompt('Copia este código:', exportCode(data));
  });
  debug.button('Progreso', 'Importar', () => {
    const code = window.prompt('Pega el código:');
    const loaded = code ? importCode(code) : null;
    if (!loaded) return;
    Object.assign(data, loaded);
    persist();
    goCucha();
  });
  debug.button('Progreso', 'Borrar progreso', () => {
    if (!window.confirm('¿Borrar todo el progreso?') || !window.confirm('¿Seguro? No se puede deshacer.')) return;
    wipeAll();
  });
  Object.assign(window, {
    __quiltroSave: data,
    __quiltroMeta: { buy: (id: string) => buyUpgrade(data, id), restart: () => restart(), persist, wipe: wipeAll },
  });
  debug.select(
    'Partida',
    'Dar arma o rasgo',
    [...ARMAS.map((a) => `arma:${a.id}`), ...RASGOS.map((r) => `rasgo:${r.id}`)],
    (v) => {
      const [kind, id] = v.split(':');
      const c = ctx();
      if (!id) return;
      const owned = kind === 'arma' ? c.build.weapon(id) : c.build.trait(id);
      c.build.apply({
        kind: kind === 'arma' ? 'weapon' : 'trait',
        id,
        rarity: 'comun',
        toLevel: owned ? owned.level + 1 : 1,
      });
      c.refreshMods();
    },
  );
  debug.select('Viaje', 'Saltar al minuto…', ['0', '2.8', '3', '5.8', '6', '8.8', '9', '11.8'], (v) => {
    env.run().journey.jumpTo(Number(v), ctx());
  });
  debug.select('Viaje', 'Invocar jefe', JEFES.map((j) => j.id), (id) => env.run().journey.spawnBoss(id, ctx()));
  debug.button('Viaje', 'La Antártica', () => env.run().journey.continueToAntarctica(ctx()));
  debug.select('Viaje', 'Evolucionar…', EVOLUCIONES.map((e) => e.id), (id) => {
    const c = ctx();
    const ev = EVOLUCIONES.find((e) => e.id === id);
    if (!ev) return;
    for (let i = 0; i < 5 && (c.build.weapon(ev.weapon)?.level ?? 0) < 5; i++) {
      const w = c.build.weapon(ev.weapon);
      c.build.apply({ kind: 'weapon', id: ev.weapon, rarity: 'comun', toLevel: w ? w.level + 1 : 1 });
    }
    if (!c.build.trait(ev.trait)) c.build.apply({ kind: 'trait', id: ev.trait, rarity: 'comun', toLevel: 1 });
    c.build.apply({ kind: 'evolution', id: ev.weapon, evolution: ev.id, rarity: 'legendaria' });
    c.refreshMods();
  });
  debug.stat('Viaje', 'zona / peligro', () => `${env.run().journey.zone.id}`);
  debug.slider('Volantín', 'volantines (0 = build)', { min: 0, max: 8, step: 1 }, () => 0, (v) => {
    const k = env.run().weapons.get<Volantin>('volantin');
    if (k) k.forceCount = v;
  });
  debug.slider('Ajustes', 'escala de tiempo', { min: 0, max: 2, step: 0.05 }, () => loop.timeScale, (v) => {
    loop.timeScale = v;
  });
  debug.slider('Ajustes', 'escala del mundo (px GDD)', { min: 0.4, max: 1, step: 0.05 }, () => TUNING.worldScale, (v) => {
    TUNING.worldScale = v;
  });
  debug.slider('Ajustes', 'sacudida', { min: 0, max: 1, step: 0.1 }, () => ctx().shake.amount, (v) => {
    ctx().shake.amount = v;
  });
  debug.slider('Ajustes', 'volumen efectos', { min: 0, max: 1, step: 0.05 }, () => sfx.volume, (v) => sfx.setVolume(v));
  debug.slider('Ajustes', 'volumen música', { min: 0, max: 1, step: 0.05 }, () => data.settings.music, (v) => {
    data.settings.music = v;
    music.setVolume(v);
  });
  debug.stat('Audio', 'motor', () => (engine.ready ? `listo (${engine.ctx?.state})` : 'esperando un toque'));
  debug.stat('Audio', 'nivel de salida', () => engine.level().toFixed(3));
  debug.stat('Audio', 'música', () => {
    const s = music.state();
    return `${s.set ?? '—'}${s.boss ? ' +jefe' : ''}${s.cueca ? ' +cueca' : ''} [${s.layers.base.toFixed(1)} ${s.layers.ritmo.toFixed(1)} ${s.layers.melodia.toFixed(1)}]`;
  });
  debug.select('Audio', 'Tocar música…', SET_IDS, (id) => music.setScene(id as SetId));
  debug.button('Audio', 'Jefe on/off', () => music.setBoss(!music.state().boss));
  debug.button('Audio', 'Cueca 20 s', () => music.startCueca(20));
  debug.select('Audio', 'Tocar efecto…', Object.keys(PRIORITY), (id) => sfx.play(id as SoundId));
  debug.toggleControl('Ajustes', 'Números de daño', () => ctx().numbers.enabled, (v) => {
    ctx().numbers.enabled = v;
  });
  debug.toggleControl('Ajustes', 'Reducir destellos', () => ctx().screen.reduceFlashes, (v) => {
    ctx().screen.reduceFlashes = v;
  });

  // Test hook (only with ?debug): advance the simulation without waiting for frames.
  if (new URLSearchParams(location.search).has('debug')) {
    const { playRun, summarize, benchWeapon } = await import('./bot.ts');
    const benchState = { running: false, results: [] as unknown[], error: '' };
    /** Balance bot: `__quiltroBot.start('medio', 20)` runs in the background; read `.status()`. */
    const botState = { running: false, done: 0, total: 0, reports: [] as unknown[], error: '' };
    const botHooks = {
      start(seed: number, character?: string): RunScene {
        const r = env.startBotRun(seed, character);
        loop.locked = true;
        return r;
      },
      tick(frames: number): void {
        for (let i = 0; i < frames; i++) scenes.update(1 / 60);
      },
    };
    Object.assign(window, {
      __quiltroBot: {
        start(skill: 'novato' | 'medio' | 'experto', runs: number, seed0 = 1000, maxMinutes = 16, invincible = false, character = 'quiltro'): void {
          if (botState.running) return;
          Object.assign(botState, { running: true, done: 0, total: runs, reports: [], error: '' });
          void (async () => {
            try {
              for (let i = 0; i < runs; i++) {
                botState.reports.push(await playRun(botHooks, seed0 + i, skill, maxMinutes, invincible, character));
                botState.done = i + 1;
              }
            } catch (err) {
              botState.error = String(err);
            }
            botState.running = false;
            loop.locked = false;
          })();
        },
        /** Weapon bench: `__quiltroBot.bench(['volantin','fuegos'], [1,3,5], [8,30])`, then `.benchResults()`. */
        bench(weapons: string[], levels: number[], densities: number[], seconds = 30): void {
          if (benchState.running) return;
          Object.assign(benchState, { running: true, results: [], error: '' });
          void (async () => {
            try {
              for (const d of densities) {
                for (const w of weapons) {
                  for (const l of levels) benchState.results.push(await benchWeapon(botHooks, w, l, d, seconds));
                }
              }
            } catch (err) {
              benchState.error = String(err);
            }
            benchState.running = false;
            loop.locked = false;
          })();
        },
        benchResults: () => ({ running: benchState.running, error: benchState.error, results: benchState.results }),
        status: () => ({ running: botState.running, done: botState.done, total: botState.total, error: botState.error }),
        reports: () => botState.reports,
        summary: () => summarize(botState.reports as Parameters<typeof summarize>[0]),
      },
    });
    Object.assign(window, {
      __quiltroAudio: { engine, music, sfx },
      __quiltroShare: { renderCard, goDaily },
      __quiltro: {
        step(seconds: number): void {
          const n = Math.round(seconds * 60);
          for (let i = 0; i < n; i++) scenes.update(1 / 60);
          scenes.render(1);
          app.renderer.render(app.stage);
        },
        get run(): RunScene {
          return env.run();
        },
        /**
         * Frame-cost stress test (milliseconds of CPU per frame, update + draw, no waiting for the screen):
         * `__quiltro.perf({ extreme: true, weapons: ['ronda'] })` after `goDaily()`. It gives every chosen weapon
         * five levels, jumps to minute 10 and keeps ~200 enemies around a dog that walks in circles.
         * `extreme` adds +6 projectiles, ×3 area, ×0.3 cooldown: what a late build looks like.
         */
        perf(opts: { extreme?: boolean; weapons?: string[]; frames?: number } = {}): Record<string, number> {
          const run = env.run();
          const c = run.ctx;
          const p = c.player;
          const frames = opts.frames ?? 900;
          const weapons = opts.weapons ?? ARMAS.filter((a) => a.takesSlot).map((a) => a.id);
          c.debug.invincible = true;
          c.progress.level = 400;
          for (const w of weapons) {
            for (let l = 0; l < 5; l++) {
              const owned = c.build.weapon(w);
              c.build.apply({ kind: 'weapon', id: w, rarity: 'epica', toLevel: owned ? owned.level + 1 : 1 });
            }
          }
          c.refreshMods();
          const boost = opts.extreme ? { projectiles: 6, areaMult: 3, cooldownMult: 0.3, damageMult: 5 } : {};
          Object.assign(c.mods, boost);
          run.journey.jumpTo(10, c);
          const render: Record<string, number> = {};
          for (const w of weapons) {
            const weapon = run.weapons.get(w);
            if (!weapon) continue;
            const draw = weapon.render.bind(weapon);
            weapon.render = (...args): void => {
              const t0 = performance.now();
              draw(...args);
              render[w] = (render[w] ?? 0) + performance.now() - t0;
            };
          }
          const times: number[] = [];
          let angle = 0;
          for (let i = 0; i < frames; i++) {
            c.progress.xp = 0;
            // A card screen or a box would freeze the fight and hide the cost: keep playing.
            const scene = run as unknown as { mode: string };
            if (scene.mode !== 'playing' && scene.mode !== 'slowmo') scene.mode = 'playing';
            Object.assign(c.mods, boost);
            if (i % 20 === 0 && c.enemies.activeCount < 200) {
              for (let k = 0; k < 30; k++) {
                const a = c.rng.range(0, Math.PI * 2);
                c.enemies.spawn(['tempano', 'chingue', 'zancudo', 'micro'][k % 4] ?? 'zancudo', p.x + Math.cos(a) * 230, p.y + Math.sin(a) * 150, c.time / 60, c);
              }
            }
            p.x += Math.cos(angle) * 1.6;
            p.y += Math.sin(angle) * 1.6;
            angle += 0.004;
            const t0 = performance.now();
            this.step(1 / 60);
            times.push(performance.now() - t0);
          }
          times.sort((a, b) => a - b);
          const out: Record<string, number> = {
            avgMs: Math.round((times.reduce((s, v) => s + v, 0) / frames) * 100) / 100,
            p99Ms: Math.round((times[Math.floor(frames * 0.99)] ?? 0) * 100) / 100,
            kills: c.stats.kills,
          };
          for (const [w, ms] of Object.entries(render)) out[`dibujo:${w}`] = Math.round((ms / frames) * 1000) / 1000;
          return out;
        },
      },
    });
  }
}
