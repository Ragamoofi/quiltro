import { Application, Rectangle, TextureStyle } from 'pixi.js';
import { loadSprites } from './art/assets.ts';
import { COLORS } from './art/palette.ts';
import { AudioEngine } from './audio/engine.ts';
import { Music } from './audio/music.ts';
import { PRIORITY, Sfx, type SoundId } from './audio/sfx.ts';
import { SET_IDS, type SetId } from './audio/musicData.ts';
import { fitDisplay, type DisplayFit } from './core/display.ts';
import { Emitter, type GameEvents } from './core/events.ts';
import { Input } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { SceneManager, type Scene } from './core/scene.ts';
import { PERSONAJES } from './data/personajes.ts';
import { defaultLoadout, type Loadout } from './game/loadout.ts';
import { t } from './i18n/index.ts';
import { affordable, applyRun, buy as buyUpgrade, checkUnlocks, metaBonus, type RunResult, type RunRewards } from './meta/progress.ts';
import { exportCode, importCode, load, save, wipe } from './meta/save.ts';
import { dailyKey, dailyNumber, finishDaily, startDaily, type DailyRun, type ShareInfo } from './meta/daily.ts';
import { buildShareCard, CARD_H, CARD_SCALE, CARD_W } from './ui/shareCard.ts';
import { CuchaScene } from './ui/cuchaScene.ts';
import { ComicScene } from './ui/scenes/comicScene.ts';
import { LoadingScene } from './ui/scenes/loadingScene.ts';
import { MapScene } from './ui/scenes/mapScene.ts';
import { MenuScene } from './ui/scenes/menuScene.ts';
import { OptionsScene } from './ui/scenes/optionsScene.ts';
import { SelectScene } from './ui/scenes/selectScene.ts';
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
  // Audio: one shared context. Tone.js downloads in the background; nothing starts before the first touch.
  const engine = new AudioEngine();
  engine.preload();
  const sfx = new Sfx(engine);
  const music = new Music(engine);
  music.onAmbient = (id, pan) => {
    // The neighbourhood behind the menu: far-off dogs, birds, a bus.
    if (id === 'bocina') sfx.play('bocina', { gain: 0.12, pitch: 0.85, pan });
    else sfx.play(id, { gain: id === 'pajaro' ? 0.8 : 0.5, pan, pitch: 0.9 + Math.random() * 0.25 });
  };
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
    update: (dt) => {
      // Gamepad buttons are read here so menus can use them too.
      input.poll();
      scenes.update(dt);
    },
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

  // ---- Progress (La Cucha) ----
  const data = load();
  checkUnlocks(data);
  let wiping = false;
  const persist = (): void => {
    if (!wiping) save(data);
  };
  const wipeAll = (): void => {
    wiping = true;
    wipe();
    location.reload();
  };
  /**
   * The Ruta del día is the same for everybody, so it uses the plain Quiltro
   * with no Cucha upgrades: the result can be compared fairly.
   */
  const loadout = (forDaily = false): Loadout => ({
    character: forDaily
      ? defaultLoadout().character
      : (PERSONAJES.find((p) => p.id === data.character && data.characters.includes(p.id)) ?? defaultLoadout().character),
    meta: forDaily ? defaultLoadout().meta : metaBonus(data),
    bandana: data.bandana,
    known: [...data.achievements],
    settings: forDaily ? { ...data.settings, tips: false } : data.settings,
    tipsShown: [...data.tipsShown],
  });

  // ---- Sharing: text to the clipboard, image through the phone's share sheet or a download ----
  const copyText = async (text: string): Promise<string> => {
    try {
      await navigator.clipboard.writeText(text);
      return t('compartir.copiado');
    } catch {
      window.prompt(t('compartir.copiar'), text);
      return t('compartir.copiado');
    }
  };
  const renderCard = async (info: ShareInfo): Promise<Blob> => {
    const card = buildShareCard(info);
    const canvas = app.renderer.extract.canvas({
      target: card,
      frame: new Rectangle(0, 0, CARD_W, CARD_H),
      resolution: CARD_SCALE,
    }) as HTMLCanvasElement;
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
    card.destroy({ children: true });
    if (!blob) throw new Error('No se pudo crear la imagen');
    return blob;
  };
  const shareImage = async (info: ShareInfo, text: string): Promise<string> => {
    try {
      const blob = await renderCard(info);
      const file = new File([blob], 'quiltro.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return t('compartir.compartido');
      }
      // No share sheet (desktop): save the image and copy the text.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiltro.png';
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      await copyText(text);
      return t('compartir.descargado');
    } catch (err) {
      // The player closing the share sheet is not an error.
      return err instanceof DOMException && err.name === 'AbortError' ? '' : t('compartir.error');
    }
  };
  /** Applies the saved options to everything outside a run (volume, controls). */
  const applySettings = (): void => {
    sfx.setVolume(data.settings.sfx);
    music.setVolume(data.settings.music);
    input.holdMode = data.settings.holdMode;
    input.joystickMode = data.settings.joystick;
  };
  applySettings();
  const optionHooks = {
    changed: () => {
      applySettings();
      persist();
    },
    exportCode: () => exportCode(data),
    importCode: (code: string) => {
      const loaded = importCode(code);
      if (!loaded) return false;
      Object.assign(data, loaded);
      persist();
      applySettings();
      return true;
    },
    wipe: () => wipeAll(),
    replayIntro: () => goIntro(() => goMenu()),
  };
  const onFinishOn = (
    save: typeof data,
    result: RunResult,
  ): RunRewards & { affordable: string | null; newCharacterNames: string[] } => {
    const rewards = applyRun(save, result);
    const cheap = affordable(save);
    return {
      ...rewards,
      affordable: cheap ? t(cheap.nameKey) : null,
      newCharacterNames: rewards.newCharacters.map((id) => t(PERSONAJES.find((p) => p.id === id)?.nameKey ?? id)),
    };
  };
  const onFinish = (result: RunResult): RunRewards & { affordable: string | null; newCharacterNames: string[] } => {
    const rewards = onFinishOn(data, result);
    data.lastSeen = Date.now();
    persist();
    return rewards;
  };

  /** Scene-local key handlers are dropped on every scene change; F1 stays. */
  const switchTo = (make: () => Scene): void => {
    input.clearPresses();
    const scene = make();
    input.onPress('F1', () => debug.toggle());
    scenes.change(scene, fit.width, fit.height);
  };

  /** `botSeed`: a balance-bot trip (plain Quiltro, fixed seed, nothing is saved). */
  const makeRun = (daily: DailyRun | null = null, botSeed?: number): RunScene =>
    new RunScene(input, sfx, music, {
      seed: daily ? daily.seed : (botSeed ?? Date.now() >>> 0),
      mobile: isMobile(),
      loadout: loadout(daily !== null || botSeed !== undefined),
      setTimeScale: (v) => {
        loop.timeScale = v;
      },
      // "¡Otra, al tiro!" repeats the route on a daily (without counting again).
      onRestart: () => (daily ? goDaily() : restart()),
      onFinish: (result) => {
        // A bot trip must not touch the real save: compute the rewards on a copy.
        if (botSeed !== undefined) return onFinishOn(structuredClone(data), result);
        if (daily) {
          finishDaily(data, daily, result.bestKm ?? result.km);
          persist();
        }
        return onFinish(result);
      },
      daily,
      share: { copy: copyText, image: shareImage },
      onCucha: () => goCucha(),
      onMenu: () => goMenu(),
      onTip: (id) => {
        if (!data.tipsShown.includes(id)) data.tipsShown.push(id);
        persist();
      },
      options: optionHooks,
    });
  let run: RunScene;
  /** Straight into a trip (also "¡Otra, al tiro!": one touch from death to the next run). */
  const restart = (): void => {
    switchTo(() => (run = makeRun()));
  };
  /** Today's route: the first start of the day counts, the next ones are practice. */
  const goDaily = (): void => {
    const daily = startDaily(data);
    persist();
    switchTo(() => (run = makeRun(daily)));
  };
  const goCucha = (): void => {
    music.setScene('menu');
    switchTo(() => new CuchaScene(input, sfx, data, { save: persist, travel: () => goSelect() }));
  };
  const goMenu = (): void => {
    music.setScene('menu');
    switchTo(
      () =>
        new MenuScene(input, sfx, data, {
          travel: () => goSelect(),
          daily: () => goDaily(),
          cucha: () => goCucha(),
          options: () => goOptions(),
        }),
    );
  };
  const goOptions = (): void => {
    music.setScene('menu');
    switchTo(() => new OptionsScene(input, data.settings, { ...optionHooks, close: () => goMenu() }));
  };
  const goSelect = (): void => {
    music.setScene('menu');
    switchTo(() => new SelectScene(input, sfx, data, { go: () => goMap(), back: () => goMenu(), save: persist }));
  };
  const goMap = (): void => {
    switchTo(() => new MapScene(input, data, () => restart()));
  };
  const goIntro = (then: () => void): void => {
    music.setScene('menu');
    switchTo(
      () =>
        new ComicScene(input, sfx, 'intro', () => {
          data.introSeen = true;
          persist();
          then();
        }),
    );
  };
  // Loading (< 2 s) → first time: the intro (one tap skips it) and straight into the trip;
  // afterwards: the main menu.
  run = makeRun();
  switchTo(
    () =>
      new LoadingScene(() => {
        if (!data.introSeen) goIntro(() => restart());
        else if (data.totals.runs === 0) restart();
        else goMenu();
      }, Math.floor(Math.random() * 7)),
  );
  window.addEventListener('beforeunload', () => {
    data.lastSeen = Date.now();
    persist();
  });
  applyFit();
  window.addEventListener('resize', applyFit);

  // Audio can only start after a user gesture.
  const unlock = (): void => engine.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // Pause automatically when the tab is hidden (GDD "Celular").
  let pausedByVisibility = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pausedByVisibility = true;
      if (scenes.active === run) run.pauseIfPlaying();
      loop.stop();
      engine.suspend();
      events.emit('pause', { paused: true });
    } else if (pausedByVisibility) {
      pausedByVisibility = false;
      loop.start();
      engine.resume();
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
    const { playRun, summarize, benchWeapon } = await import('./debug/bot.ts');
    const benchState = { running: false, results: [] as unknown[], error: '' };
    /** Balance bot: `__quiltroBot.start('medio', 20)` runs in the background; read `.status()`. */
    const botState = { running: false, done: 0, total: 0, reports: [] as unknown[], error: '' };
    const botHooks = {
      start(seed: number): RunScene {
        switchTo(() => (run = makeRun(null, seed)));
        loop.timeScale = 0;
        return run;
      },
      tick(frames: number): void {
        for (let i = 0; i < frames; i++) scenes.update(1 / 60);
      },
    };
    Object.assign(window, {
      __quiltroBot: {
        start(skill: 'novato' | 'medio' | 'experto', runs: number, seed0 = 1000, maxMinutes = 16): void {
          if (botState.running) return;
          Object.assign(botState, { running: true, done: 0, total: runs, reports: [], error: '' });
          void (async () => {
            try {
              for (let i = 0; i < runs; i++) {
                botState.reports.push(await playRun(botHooks, seed0 + i, skill, maxMinutes));
                botState.done = i + 1;
              }
            } catch (err) {
              botState.error = String(err);
            }
            botState.running = false;
            loop.timeScale = 1;
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
            loop.timeScale = 1;
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
