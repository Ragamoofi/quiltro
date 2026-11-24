import { Application, TextureStyle } from 'pixi.js';
import { loadSprites } from './art/assets.ts';
import { COLORS } from './art/palette.ts';
import { fitDisplay, type DisplayFit } from './core/display.ts';
import { Emitter, type GameEvents } from './core/events.ts';
import { Input } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { SceneManager } from './core/scene.ts';
import { DebugPanel } from './debug/panel.ts';
import { SandboxScene } from './game/sandboxScene.ts';

// Pixel art: nearest-neighbour everywhere, never smooth.
TextureStyle.defaultOptions.scaleMode = 'nearest';

async function boot(): Promise<void> {
  const host = document.getElementById('game');
  if (!host) throw new Error('#game no existe');

  const events = new Emitter<GameEvents>();
  const debug = new DebugPanel();
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

  const sandbox = new SandboxScene(input);
  scenes.change(sandbox, fit.width, fit.height);
  applyFit();
  window.addEventListener('resize', applyFit);
  window.matchMedia?.('(resolution: 1dppx)').addEventListener?.('change', applyFit);

  // Pause automatically when the tab is hidden (GDD "Celular").
  let pausedByVisibility = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausedByVisibility = true;
      loop.stop();
      events.emit('pause', { paused: true });
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      loop.start();
      events.emit('pause', { paused: false });
    }
  });

  input.onPress('F1', () => debug.toggle());

  debug.stat('Rendimiento', 'fps', () => String(loop.fps));
  debug.stat('Rendimiento', 'actualizaciones/s', () => String(loop.ups));
  debug.stat('Rendimiento', 'entidades', () => String(sandbox.entityCount));
  debug.stat('Pantalla', 'resolución', () => `${fit.width}×${fit.height} ×${fit.scale}${fit.portrait ? ' (vertical)' : ''}`);
  debug.stat('Pantalla', 'renderer', () => app.renderer.name);
  debug.slider('Tiempo', 'escala de tiempo', { min: 0, max: 2, step: 0.05 }, () => loop.timeScale, (v) => {
    loop.timeScale = v;
  });
  debug.stat('Partida', 'tasa de aparición', () => '— (Fase 2)');
  debug.button('Partida', 'Invencible', () => {}, false);
  debug.button('Partida', 'Dar arma o rasgo', () => {}, false);
  debug.button('Partida', 'Saltar al minuto…', () => {}, false);
  debug.button('Partida', 'Invocar jefe', () => {}, false);
  debug.note('Partida', 'Se activan cuando existan esos sistemas.');

  loop.start();
}

boot().catch((err: unknown) => {
  console.error(err);
  const p = document.createElement('pre');
  p.style.cssText = 'color:#E63946;padding:16px;white-space:pre-wrap;font:12px monospace';
  p.textContent = `QUILTRO no pudo partir:\n${String(err)}`;
  document.body.append(p);
});
