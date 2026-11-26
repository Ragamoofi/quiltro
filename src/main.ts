import { readCheckpoint, storeCheckpoint, type Checkpoint } from './game/checkpoint.ts';
import { Application, Rectangle, TextureStyle } from 'pixi.js';
import { loadSprites } from './art/assets.ts';
import { COLORS } from './art/palette.ts';
import { AudioEngine } from './audio/engine.ts';
import { Music } from './audio/music.ts';
import { Sfx } from './audio/sfx.ts';
import { fitDisplay, type DisplayFit } from './core/display.ts';
import { Emitter, type GameEvents } from './core/events.ts';
import { Input } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { SceneManager, type Scene } from './core/scene.ts';
import { PERSONAJES } from './data/personajes.ts';
import { pasajeAt, pasajesOpen } from './data/pasajes.ts';
import { defaultLoadout, type Loadout } from './game/loadout.ts';
import { t } from './i18n/index.ts';
import { affordable, applyRun, checkUnlocks, metaBonus, type RunResult, type RunRewards } from './meta/progress.ts';
import { exportCode, importCode, load, save, wipe } from './meta/save.ts';
import { finishDaily, startDaily, type DailyRun, type ShareInfo } from './meta/daily.ts';
import { buildShareCard, CARD_H, CARD_SCALE, CARD_W } from './ui/shareCard.ts';
import { CuchaScene } from './ui/cuchaScene.ts';
import { ComicScene } from './ui/scenes/comicScene.ts';
import { LoadingScene } from './ui/scenes/loadingScene.ts';
import { MapScene } from './ui/scenes/mapScene.ts';
import { MenuScene } from './ui/scenes/menuScene.ts';
import { OptionsScene } from './ui/scenes/optionsScene.ts';
import { SelectScene } from './ui/scenes/selectScene.ts';
import { installDebug } from './debug/install.ts';
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

  /** Full screen (the F key and the option): on a 1080p monitor it fills the screen at exactly ×4. */
  const toggleFullscreen = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  };
  window.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (e.code !== 'KeyF' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    toggleFullscreen();
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
    pasaje: forDaily ? 0 : Math.min(data.pasaje, pasajesOpen(data.pasajesGanados) - 1),
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
    fullscreen: () => document.fullscreenElement !== null,
    toggleFullscreen: () => toggleFullscreen(),
  };
  const onFinishOn = (
    save: typeof data,
    result: RunResult,
  ): RunRewards & { affordable: string | null; newCharacterNames: string[]; newPasajeName: string | null } => {
    const rewards = applyRun(save, result);
    const cheap = affordable(save);
    return {
      ...rewards,
      affordable: cheap ? t(cheap.nameKey) : null,
      newCharacterNames: rewards.newCharacters.map((id) => t(PERSONAJES.find((p) => p.id === id)?.nameKey ?? id)),
      newPasajeName: rewards.newPasaje !== undefined ? t(`${pasajeAt(rewards.newPasaje).i18n}.nombre`) : null,
    };
  };
  const onFinish = (result: RunResult): RunRewards & { affordable: string | null; newCharacterNames: string[]; newPasajeName: string | null } => {
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
  const makeRun = (daily: DailyRun | null = null, botSeed?: number, botCharacter?: string, botPasaje = 0, checkpoint?: Checkpoint): RunScene =>
    new RunScene(input, sfx, music, {
      seed: checkpoint?.seed ?? (daily ? daily.seed : (botSeed ?? Date.now() >>> 0)),
      ...(checkpoint ? { checkpoint } : {}),
      ...(!daily && botSeed === undefined ? { saveCheckpoint: storeCheckpoint } : {}),
      mobile: isMobile(),
      loadout: checkpoint?.loadout ?? (botCharacter
        ? { ...loadout(true), character: PERSONAJES.find((p) => p.id === botCharacter) ?? defaultLoadout().character, pasaje: botPasaje }
        : botSeed !== undefined
          ? { ...loadout(true), pasaje: botPasaje }
          : loadout(daily !== null)),
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
        if (!daily) storeCheckpoint(null);
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
  /** Fase 11.10: the intro comic plays the first time the player presses Viajar, not before the menu. */
  const travel = (): void => {
    if (!data.introSeen) goIntro(() => (data.totals.runs === 0 ? restart() : goSelect()));
    else goSelect();
  };
  const goMenu = (): void => {
    music.setScene('menu');
    switchTo(
      () =>
        new MenuScene(input, sfx, data, {
          travel: () => travel(),
          resume: () => {
            const saved = readCheckpoint();
            if (saved) switchTo(() => (run = makeRun(null, undefined, undefined, 0, saved)));
          },
          hasCheckpoint: readCheckpoint() !== null,
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
  // Loading (< 2 s) → the main menu (the intro waits for the first Viajar).
  run = makeRun();
  switchTo(
    () =>
      new LoadingScene(() => {
        goMenu();
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

  await installDebug({
    debug, app, loop, scenes, engine, music, sfx, data, restart, goCucha, goDaily, persist, wipeAll, renderCard,
    run: () => run,
    fit: () => fit,
    startBotRun: (seed: number, character?: string, pasaje?: number) => {
      switchTo(() => (run = makeRun(null, seed, character, pasaje)));
      return run;
    },
  });

  loop.start();
}

boot().catch((err: unknown) => {
  console.error(err);
  const p = document.createElement('pre');
  p.style.cssText = 'color:#E63946;padding:16px;white-space:pre-wrap;font:12px monospace';
  p.textContent = `QUILTRO no pudo partir:\n${String(err)}`;
  document.body.append(p);
});
