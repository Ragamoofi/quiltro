import { Application, TextureStyle } from 'pixi.js';
import { loadSprites } from './art/assets.ts';
import { COLORS } from './art/palette.ts';
import { Sfx } from './audio/sfx.ts';
import { fitDisplay, type DisplayFit } from './core/display.ts';
import { Emitter, type GameEvents } from './core/events.ts';
import { Input } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { SceneManager } from './core/scene.ts';
import { ARMAS } from './data/armas.ts';
import { spawnPerSecond, TUNING, xpToNext } from './data/balance.ts';
import { EVOLUCIONES } from './data/evoluciones.ts';
import { JEFES } from './data/jefes.ts';
import { RASGOS } from './data/rasgos.ts';
import type { Volantin } from './game/weapons/volantin.ts';
import { DebugPanel } from './debug/panel.ts';
import { RunScene } from './game/runScene.ts';

// Pixel art: nearest-neighbour everywhere, never smooth.
TextureStyle.defaultOptions.scaleMode = 'nearest';

const isMobile = (): boolean => window.matchMedia?.('(pointer: coarse)').matches ?? false;

async function boot(): Promise<void> {
  const host = document.getElementById('game');
  if (!host) throw new Error('#game no existe');

  const events = new Emitter<GameEvents>();
  const debug = new DebugPanel();
  const sfx = new Sfx();
  let fit: DisplayFit = fitDisplay(window.innerWidth, window.innerHeight, window.devicePixelRatio);

  const app = new Application();
  await app.init({
    width: fit.width,
    height: fit.height,
    background: COLORS.ink,
    antialias: false,
    resolution: 1,
    roundPixels: true,
    autoStart: false,
    preference: 'webgl',
    powerPreference: 'high-performance',
  });
  app.ticker.stop();
  host.append(app.canvas);

  await loadSprites();

  const input = new Input(app.canvas);
  const scenes = new SceneManager(app.stage);
  const loop = new GameLoop({
    update: (dt) => scenes.update(dt),
    render: (alpha) => {
      scenes.render(alpha);
      app.renderer.render(app.stage);
    },
  });

  const applyFit = (): void => {
    fit = fitDisplay(window.innerWidth, window.innerHeight, window.devicePixelRatio);
    if (app.renderer.width !== fit.width || app.renderer.height !== fit.height) {
      app.renderer.resize(fit.width, fit.height);
      scenes.resize(fit.width, fit.height);
    }
    app.canvas.style.width = `${fit.cssWidth}px`;
    app.canvas.style.height = `${fit.cssHeight}px`;
    events.emit('resize', { width: fit.width, height: fit.height, scale: fit.scale, portrait: fit.portrait });
  };

  const makeRun = (): RunScene =>
    new RunScene(input, sfx, {
      seed: Date.now() >>> 0,
      mobile: isMobile(),
      setTimeScale: (v) => {
        loop.timeScale = v;
      },
      onRestart: () => restart(),
    });
  let run = makeRun();
  const restart = (): void => {
    run = makeRun();
    scenes.change(run, fit.width, fit.height);
  };
  scenes.change(run, fit.width, fit.height);
  applyFit();
  window.addEventListener('resize', applyFit);

  // Audio can only start after a user gesture.
  const unlock = (): void => sfx.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // Pause automatically when the tab is hidden (GDD "Celular").
  let pausedByVisibility = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausedByVisibility = true;
      loop.stop();
      sfx.suspend();
      events.emit('pause', { paused: true });
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      loop.start();
      sfx.resume();
      events.emit('pause', { paused: false });
    }
  });

  input.onPress('F1', () => debug.toggle());

  // ---- Debug panel (F1) ----
  const ctx = (): RunScene['ctx'] => run.ctx;
  debug.stat('Rendimiento', 'fps', () => String(loop.fps));
  debug.stat('Rendimiento', 'actualizaciones/s', () => String(loop.ups));
  debug.stat('Rendimiento', 'enemigos', () => String(ctx().enemies.activeCount));
  debug.stat('Pantalla', 'resolución', () => `${fit.width}×${fit.height} ×${fit.scale}${fit.portrait ? ' (vertical)' : ''}`);
  debug.stat('Partida', 'tiempo', () => `${Math.floor(ctx().time / 60)}:${String(Math.floor(ctx().time % 60)).padStart(2, '0')}`);
  debug.stat('Partida', 'tasa de aparición', () => `${spawnPerSecond(ctx().time / 60).toFixed(2)}/s`);
  debug.stat('Partida', 'muertes / comida', () => `${ctx().stats.kills} / ${ctx().stats.food}`);
  debug.toggleControl('Partida', 'Invencible', () => ctx().debug.invincible, (v) => {
    ctx().debug.invincible = v;
  });
  debug.toggleControl('Partida', 'Aparecen enemigos', () => run.spawner.enabled, (v) => {
    run.spawner.enabled = v;
  });
  debug.button('Partida', '+50 zancudos', () => {
    const c = ctx();
    for (let i = 0; i < 50; i++) {
      const a = c.rng.range(0, Math.PI * 2);
      c.enemies.spawn('zancudo', c.player.x + Math.cos(a) * 200, c.player.y + Math.sin(a) * 140, c.time / 60, c);
    }
  });
  debug.button('Partida', 'Bandada', () => run.spawner.flock(ctx(), fit.width, fit.height));
  debug.button('Partida', '¡Te rodearon!', () => run.spawner.ring(ctx(), 30));
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
    run.journey.jumpTo(Number(v), ctx());
  });
  debug.select('Viaje', 'Invocar jefe', JEFES.map((j) => j.id), (id) => run.journey.spawnBoss(id, ctx()));
  debug.button('Viaje', 'La Antártica', () => run.journey.continueToAntarctica(ctx()));
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
  debug.stat('Viaje', 'zona / peligro', () => `${run.journey.zone.id}`);
  debug.slider('Volantín', 'volantines (0 = build)', { min: 0, max: 8, step: 1 }, () => 0, (v) => {
    const k = run.weapons.get<Volantin>('volantin');
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
  debug.slider('Ajustes', 'volumen', { min: 0, max: 1, step: 0.05 }, () => sfx.volume, (v) => sfx.setVolume(v));
  debug.toggleControl('Ajustes', 'Números de daño', () => ctx().numbers.enabled, (v) => {
    ctx().numbers.enabled = v;
  });
  debug.toggleControl('Ajustes', 'Reducir destellos', () => ctx().screen.reduceFlashes, (v) => {
    ctx().screen.reduceFlashes = v;
  });

  // Test hook (only with ?debug): advance the simulation without waiting for frames.
  if (new URLSearchParams(location.search).has('debug')) {
    Object.assign(window, {
      __quiltro: {
        step(seconds: number): void {
          const n = Math.round(seconds * 60);
          for (let i = 0; i < n; i++) scenes.update(1 / 60);
          scenes.render(1);
          app.renderer.render(app.stage);
        },
        get run(): RunScene {
          return run;
        },
      },
    });
  }

  loop.start();
}

boot().catch((err: unknown) => {
  console.error(err);
  const p = document.createElement('pre');
  p.style.cssText = 'color:#E63946;padding:16px;white-space:pre-wrap;font:12px monospace';
  p.textContent = `QUILTRO no pudo partir:\n${String(err)}`;
  document.body.append(p);
});
