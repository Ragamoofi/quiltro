import { Application, TextureStyle } from 'pixi.js';
import { loadSprites } from './art/assets.ts';
import { COLORS } from './art/palette.ts';
import { Sfx } from './audio/sfx.ts';
import { fitDisplay, type DisplayFit } from './core/display.ts';
import { Emitter, type GameEvents } from './core/events.ts';
import { Input } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { SceneManager } from './core/scene.ts';
import { spawnPerSecond, TUNING } from './data/balance.ts';
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

  let run = new RunScene(input, sfx, Date.now() >>> 0, isMobile());
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
  debug.button('Partida', 'Reiniciar', () => {
    run = new RunScene(input, sfx, Date.now() >>> 0, isMobile());
    scenes.change(run, fit.width, fit.height);
  });
  debug.button('Partida', 'Dar arma o rasgo', () => {}, false);
  debug.button('Partida', 'Invocar jefe', () => {}, false);
  debug.slider('Volantín', 'volantines', { min: 1, max: 8, step: 1 }, () => ctx().kites.count, (v) => {
    ctx().kites.setCount(v);
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
