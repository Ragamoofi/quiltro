import { Container } from 'pixi.js';

import { SUELO_CENTRO_PESOS, SUELO_PESOS } from '../art/sprites/suelos.ts';
import { ambienteAt, CIUDADES } from '../data/zonas.ts';
import type { Sfx } from '../audio/sfx.ts';
import { Camera } from '../core/camera.ts';
import type { Input } from '../core/input.ts';
import { deriveSeed, Rng } from '../core/rng.ts';
import type { Scene } from '../core/scene.ts';
import { ENEMY_CAP, LEVEL_UP, xpToNext } from '../data/balance.ts';

import { t, tList } from '../i18n/index.ts';
import { Banner } from '../ui/banner.ts';
import { CajaView } from '../ui/cajaView.ts';

import { pillarLine } from '../ui/cardText.ts';
import { EndScreen } from '../ui/endScreen.ts';
import { Hud } from '../ui/hud.ts';
import { LevelUpView } from '../ui/levelUp.ts';
import { PauseView } from '../ui/pauseView.ts';
import { LOGROS } from '../data/logros.ts';
import type { RunResult, RunRewards } from '../meta/progress.ts';
import { shareText, type DailyRun, type ShareInfo } from '../meta/daily.ts';

import { Build, type Offer } from './build.ts';
import type { Music } from '../audio/music.ts';
import { setForZone } from '../audio/musicData.ts';
import { baseMods, type Loadout } from './loadout.ts';
import { Tutorial } from './tutorial.ts';
import { OptionsView, type OptionsHooks } from '../ui/optionsView.ts';
import { ComicScene } from '../ui/scenes/comicScene.ts';
import type { RunContext } from './context.ts';
import { Enemies } from './entities/enemies.ts';
import { Food } from './entities/food.ts';
import { Player } from './entities/player.ts';
import { DamageNumbers } from './fx/damageNumbers.ts';
import { Particles } from './fx/particles.ts';
import { ScreenFx } from './fx/screenFx.ts';
import { Shake } from './fx/shake.ts';
import { applyOffer, replacementFor, rollCaja } from './cards.ts';
import { Journey } from './journey.ts';
import { cityName, emptyReport, runResult, shareInfo, snapshot } from './runReport.ts';
import { Clouds } from './systems/clouds.ts';
import { EnemyShots } from './systems/enemyShots.ts';
import { SpatialGrid } from './systems/spatialGrid.ts';
import { Spawner } from './systems/spawner.ts';
import { Telegraphs } from './systems/telegraphs.ts';
import { WeaponSet } from './weapons/index.ts';
import { Decor } from './world/decor.ts';
import { FloorLayer } from './world/floor.ts';
import { Hazards } from './world/hazards.ts';
import { Passives } from './systems/passives.ts';
import { RoadEvents } from './systems/roadEvents.ts';
import { AmbientLife } from './world/ambient.ts';
import { AnimatedMoai } from './world/moai.ts';
import { Cities } from './world/cities.ts';
import { Horizon } from './world/horizon.ts';
import { Weather } from './world/weather.ts';

const ENEMY_POOL = 320;

/** Seconds of the death animation before the end screen. */
const DEATH_DELAY = 1.6;

type Mode = 'playing' | 'slowmo' | 'cards' | 'caja' | 'paused' | 'end' | 'comic';

export interface RunOptions {
  seed: number;
  mobile: boolean;
  loadout: Loadout;
  setTimeScale: (v: number) => void;
  onRestart: () => void;
  /** Saves the run and returns what it earned (lucas, achievements...). */
  onFinish: (result: RunResult) => RunRewards;
  /** Go to La Cucha (null hides the button). */
  onCucha: (() => void) | null;
  /** Back to the main menu. */
  onMenu: () => void;
  /** A tutorial tip was shown (persist it). */
  onTip: (id: string) => void;
  /** Options screen hooks (shared with the menu). */
  options: Omit<OptionsHooks, 'close'>;
  /** Ruta del día: set when this trip is today's route (counted or practice). */
  daily: DailyRun | null;
  /** Copy the text / share the image card (implemented in main: clipboard, Web Share, download). */
  share: { copy(text: string): Promise<string>; image(info: ShareInfo, text: string): Promise<string> };
}

/**
 * A run: the world, the dog and its weapons, the director, and every in-run
 * screen (level-up cards, Caja del Almacén, pause, end). Layers (back to
 * front): floor, chaya trail, shadows, food, y-sorted world, weapons, overhead
 * cables, particles, numbers, world fx — then screen fx, HUD and overlays.
 */
export class RunScene implements Scene {
  readonly root = new Container();
  readonly ctx: RunContext;
  readonly spawner = new Spawner();
  readonly weapons = new WeaponSet();

  private readonly shaken = new Container();
  private readonly worldRoot = new Container();
  private readonly shadows = new Container();
  private readonly sorted = new Container();
  private readonly floor = new FloorLayer('suelo_centro', SUELO_CENTRO_PESOS);
  private readonly camera = new Camera();
  private readonly decor: Decor;
  private readonly hud: Hud;
  private readonly banner = new Banner();
  private readonly levelUp: LevelUpView;
  private readonly caja = new CajaView();
  private readonly pause = new PauseView();
  private readonly end = new EndScreen();
  private readonly input: Input;
  private readonly opts: RunOptions;
  private viewW = 480;
  private viewH = 270;
  private freeze = 0;
  private mode: Mode = 'playing';
  private slowLeft = 0;
  private pendingLevels = 0;
  private offers: Offer[] = [];
  private rerolls: number = LEVEL_UP.startingRerolls;
  private banishes = 2;
  private victory = false;
  readonly journey: Journey;
  private readonly horizon = new Horizon();
  private readonly cities = new Cities();
  /** The environment (Santiago, the coast…) whose floor, horizon and weather are on screen. */
  private envId = '';
  private readonly passives = new Passives();
  /** Chests, animitas and ferias on the road (Fase 11.3). */
  readonly events: RoadEvents;
  private readonly ambient: AmbientLife;
  private readonly weather = new Weather();
  private readonly hazards = new Hazards();
  private timeScale = 1;
  private worldTime = 0;
  private cards: number = LEVEL_UP.cards;
  private revives = 0;
  /** Achievements earned this run. */
  private readonly earned = new Set<string>();
  private readonly moais: AnimatedMoai[] = [];
  private readonly tutorial: Tutorial;
  private readonly options: OptionsView;
  private comic: ComicScene | null = null;

  private readonly music: Music;
  private muffledNow = false;
  private heartbeat = 0;
  private intensityT = 0;

  constructor(input: Input, sfx: Sfx, music: Music, opts: RunOptions) {
    this.music = music;
    this.input = input;
    this.opts = opts;
    this.sorted.sortableChildren = true;
    this.decor = new Decor(this.sorted);
    this.hud = new Hud(() => this.openPause());

    const lo = opts.loadout;
    const player = new Player(lo.character.sprite, lo.bandana);
    player.radius *= lo.character.mods.hitboxMult ?? 1;
    player.slides = lo.character.mods.slides ?? false;
    player.hazardProof = lo.character.mods.ignoresHazards ?? false;
    player.dodgeChance = lo.character.mods.dodgeChance ?? 0;
    player.immuneSlow = lo.character.mods.immuneSlow ?? false;
    player.immuneWind = lo.character.mods.immuneWind ?? false;
    player.auraDps = lo.character.mods.aura?.dps ?? 0;
    player.auraRadius = lo.character.mods.aura?.radius ?? 0;
    const enemies = new Enemies(ENEMY_POOL, this.shadows, this.sorted);
    const food = new Food();
    const particles = new Particles();
    const numbers = new DamageNumbers();
    const screen = new ScreenFx();
    const build = new Build(lo.character.startingWeapon, baseMods(lo));
    build.luck = lo.meta.luck;
    for (const st of lo.character.mods.startingTraits ?? []) {
      for (let l = 1; l <= st.level; l++) build.apply({ kind: 'trait', id: st.id, rarity: 'comun', toLevel: l });
    }
    this.rerolls = LEVEL_UP.startingRerolls + lo.meta.rerolls;
    this.cards = LEVEL_UP.cards + lo.meta.cards;
    this.revives = lo.meta.revives + (lo.character.mods.extraRevives ?? 0);
    player.addTo(this.shadows, this.sorted);
    this.ambient = new AmbientLife(opts.seed);
    this.shadows.addChild(this.ambient.shadows);
    this.sorted.addChild(this.ambient.root);
    this.shadows.addChild(this.passives.ground);
    this.sorted.addChild(this.passives.pets);

    const ctx: RunContext = {
      rng: new Rng(opts.seed),
      rngDirector: new Rng(deriveSeed(opts.seed, 1)),
      rngCards: new Rng(deriveSeed(opts.seed, 2)),
      sfx,
      particles,
      numbers,
      shake: new Shake(),
      screen,
      grid: new SpatialGrid(64),
      player,
      enemies,
      food,
      build,
      telegraphs: new Telegraphs(),
      shots: new EnemyShots(),
      clouds: new Clouds(),
      wind: { x: 0, y: 0 },
      mods: build.stats(),
      refreshMods: () => {
        ctx.mods = build.stats();
        player.applyMods(ctx);
        this.weapons.sync(ctx);
      },
      time: 0,
      stats: { kills: 0, food: 0, damageTaken: 0, damageBy: {}, damageFrom: {}, lastHit: '', killsBy: {}, bossesBeaten: [], temblorQuieto: false },
      progress: { level: 1, xp: 0, lucas: 0, bosses: 0 },
      onKill: (e, source) => {
        // Quiltra: every so many enemies taken down, a little healing.
        const heal = lo.character.mods.healEvery;
        if (heal && ctx.stats.kills > 0 && ctx.stats.kills % heal.kills === 0) player.heal(heal.amount, ctx);
        // Cola alegre: every enemy taken down gives a short burst of speed.
        if (ctx.mods.killHaste > 0) {
          player.hasteT = 2;
          player.hasteAmount = ctx.mods.killHaste;
        }
        // Cielo del Dieciocho: every enemy cut by a kite heals 1.
        if (source === 'volantin' && build.evolved.has('volantin')) player.heal(1, ctx);
        // "La micro sí paró": a micro taken down before it charged.
        if (e.def.id === 'micro' && e.state !== 'carga' && e.state !== 'descanso') ctx.achieve('laMicroSiParo');
      },
      achieve: (id) => this.achieve(id),
      hitstop: (s) => {
        this.freeze = Math.max(this.freeze, s);
      },
      banner: (text, color, subtitle) => {
        this.banner.show(text, color, subtitle);
        // An important sign is on screen: the effects step back 30 % so it is heard (GDD "Mezcla").
        sfx.duck(1.8);
      },
      openCaja: (golden) => this.openCaja(golden),
      debug: { invincible: false, hitboxes: false },
    };
    this.ctx = ctx;
    ctx.refreshMods();
    this.spawner.cap = opts.mobile ? ENEMY_CAP.mobile : ENEMY_CAP.desktop;

    this.tutorial = new Tutorial({
      seen: lo.tipsShown,
      enabled: lo.settings.tips,
      touch: opts.mobile,
      markSeen: (id) => opts.onTip(id),
      spawnRing: () => this.spawner.ring(ctx, 28, this.journey.zone.id, true),
    });
    this.options = new OptionsView(lo.settings, {
      ...opts.options,
      changed: () => {
        opts.options.changed();
        this.applySettings();
      },
      close: () => this.closeOptions(),
    });

    this.levelUp = new LevelUpView({
      pick: (i) => this.pick(i),
      reroll: () => this.reroll(),
      banish: (i) => this.banish(i),
      skip: () => this.skip(),
    });

    this.journey = new Journey(ctx, {
      onZone: (z) => {
        this.floor.setFloor(`suelo_${z.id}`, SUELO_PESOS[z.id] ?? SUELO_CENTRO_PESOS);
        this.decor.setZone(z.id);
        this.horizon.setZone(z.id, this.viewW);
        this.weather.setZone(z.id, this.viewW, this.viewH, ctx.rng);
        // The environment of the new zone is applied on the next step.
        this.envId = '';
        this.hazards.setZone(z.hazard, ctx);
        // Each zone has its own music (2 s crossfade) and a short jingle when you arrive.
        this.music.setScene(setForZone(z.id));
        if (ctx.time > 1) sfx.play('zona');
      },
      onBoss: (on) => {
        this.music.setBoss(on);
        if (on) {
          // Boss intro: swell + timpani roll, effects ducked so the roll is heard.
          sfx.play('jefe');
          sfx.duck(2.4);
        }
      },
      onVictory: () => this.finish(true),
      setTimeScale: (v) => this.setTimeScale(v),
      addBoss: (root) => this.sorted.addChild(root),
      setHalfFog: (side) => {
        this.hazards.halfFogSide = side;
      },
      addMoais: (x, y) => {
        // Five guardians in an arc, looking out to sea; their eyes light up to greet the dog.
        for (let i = 0; i < 5; i++) {
          const s = new AnimatedMoai(x - 48 + i * 24, y - 20 + Math.abs(i - 2) * 6);
          this.moais.push(s);
          this.sorted.addChild(s.sprite);
        }
      },
    });

    this.events = new RoadEvents(opts.seed, (n) => this.spawner.ring(ctx, n, this.journey.zone.id));
    this.sorted.addChild(this.events.root);
    this.sorted.addChild(this.hazards.world);
    this.hazards.world.sortableChildren = true;
    this.worldRoot.addChild(
      this.weapons.floor,
      ctx.telegraphs.root,
      this.shadows,
      ctx.clouds.root,
      food.root,
      this.sorted,
      this.weapons.root,
      ctx.shots.root,
      this.decor.overhead,
      particles.root,
      numbers.root,
      screen.world,
    );
    this.shaken.addChild(this.floor.root, this.worldRoot);
    this.root.addChild(
      this.shaken,
      this.weather.root,
      this.hazards.screen,
      this.horizon.root,
      screen.screen,
      this.hud.root,
      this.banner.root,
      this.tutorial.root,
      this.levelUp.root,
      this.caja.root,
      this.pause.root,
      this.options.root,
      this.end.root,
    );
    screen.setInvertTarget(this.shaken);
    this.applySettings();

    input.onPress('Escape', () => {
      if (this.mode === 'comic') this.comic?.finish();
      else if (this.options.open) this.closeOptions();
      else this.togglePause();
    });
    input.onPress('KeyP', () => this.togglePause());
    input.onPress('KeyR', () => {
      if (this.mode === 'end') this.opts.onRestart();
    });
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((code, i) => input.onPress(code, () => this.levelUp.pressNumber(i)));
    input.onPress('ArrowLeft', () => this.navigate(-1));
    input.onPress('ArrowRight', () => this.navigate(1));
    input.onPress('ArrowUp', () => this.navigate(-1));
    input.onPress('ArrowDown', () => this.navigate(1));
    const confirm = (): void => {
      if (this.mode === 'comic') this.comic?.next();
      else if (this.mode === 'cards') this.levelUp.confirm();
      else if (this.mode === 'caja') this.caja.tap();
      else if (this.mode === 'paused') this.pause.focus.press();
      else if (this.mode === 'end') this.end.focus.press();
    };
    input.onPress('Enter', confirm);
    input.onPress('GamepadA', confirm);
  }

  /** Arrow keys / d-pad in the menus of the run. */
  private navigate(dir: number): void {
    if (this.mode === 'cards') this.levelUp.move(dir);
    else if (this.mode === 'paused' && !this.options.open) this.pause.focus.move(dir);
    else if (this.mode === 'end') this.end.focus.move(dir);
  }

  /** Applies the player's options to this run. */
  applySettings(): void {
    const s = this.opts.loadout.settings;
    const ctx = this.ctx;
    ctx.shake.amount = s.shake;
    ctx.numbers.enabled = s.damageNumbers;
    ctx.screen.reduceFlashes = s.reduceFlashes;
    ctx.telegraphs.colorblind = s.colorblind;
    const low = s.quality === 'baja' || (s.quality === 'auto' && this.opts.mobile);
    ctx.particles.scale = low ? 0.5 : 1;
    this.weather.root.visible = s.quality !== 'baja';
  }

  /** The tab was hidden: show the pause menu (GDD "Celular"). */
  pauseIfPlaying(): void {
    if (this.mode === 'playing') this.openPause();
  }

  enter(): void {
    this.camera.snapTo(this.ctx.player.x, this.ctx.player.y);
    this.music.setBoss(false);
    this.music.setMuffled(false);
    this.journey.begin(this.ctx);
  }

  exit(): void {
    this.ctx.sfx.setBuzz(0);
    this.opts.setTimeScale(1);
  }

  private setTimeScale(v: number): void {
    this.timeScale = v;
    this.opts.setTimeScale(v);
  }

  resize(width: number, height: number): void {
    this.viewW = width;
    this.viewH = height;
    this.floor.resize(width, height);
    this.ctx.screen.resize(width, height);
    this.hud.resize(width, height);
    this.banner.resize(width, height);
    this.hazards.resize(width, height);
    this.tutorial.resize(width, height);
    if (this.options.open) this.options.show(width, height);
    this.horizon.setZone(this.currentEnv()?.look ?? this.journey.zone.id, width);
    this.weather.setZone(this.currentEnv()?.weather ?? this.journey.zone.id, width, height, this.ctx.rng);
    if (this.mode === 'cards') this.showCards(false);
  }

  get currentMode(): Mode {
    return this.mode;
  }

  // ---------------------------------------------------------------- update

  update(dt: number): void {
    this.input.poll();
    const ctx = this.ctx;
    // Pause, cards and the box put the music behind a door (low-pass); playing opens it again.
    const muffle = this.mode === 'paused' || this.mode === 'cards' || this.mode === 'caja';
    if (muffle !== this.muffledNow) {
      this.muffledNow = muffle;
      this.music.setMuffled(muffle);
    }
    const real = dt / Math.max(0.05, this.timeScale);
    this.banner.update(real);
    ctx.screen.updateReal(real);
    this.levelUp.update(real);
    this.caja.update(real);
    this.end.update(real);
    if (this.comic) {
      this.comic.update(real);
      this.comic.render();
    }

    if (this.mode === 'caja' && this.caja.done) this.resume();
    if (this.mode !== 'playing' && this.mode !== 'slowmo') return;

    ctx.shake.update(dt);
    ctx.screen.update(dt);
    ctx.particles.update(dt);
    ctx.numbers.update(dt);
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    this.simulate(dt, real);
    if ((this.mode as Mode) === 'end') return;

    if (this.mode === 'slowmo') {
      this.slowLeft -= real;
      if (this.slowLeft <= 0) {
        this.setTimeScale(1);
        this.showCards(true);
      }
      return;
    }

    // Level up?
    const need = xpToNext(ctx.progress.level);
    if (ctx.progress.xp >= need) {
      ctx.progress.xp -= need;
      ctx.progress.level++;
      this.pendingLevels++;
      this.startLevelUp();
      return;
    }
    // Achievements that depend on the state of the run.
    const p = ctx.player;
    if (ctx.stats.temblorQuieto) this.achieve('niSeInmuto');
    if (ctx.build.evolved.has('volantin')) this.achieve('dieciochero');
    if (p.sinceHurt >= 300) this.achieve('puroAguante');
    if (ctx.enemies.activeCount >= 300) this.achieve('paLaFoto');

    // Segunda vida, or the end of the road (victory comes from beating Cai Cai Vilú).
    if (p.dead && p.deadFor > DEATH_DELAY * 0.7 && this.revives > 0) {
      this.revives--;
      p.revive(ctx, 0.5);
      ctx.shake.add(0.5);
      ctx.particles.burst(ctx.rng, p.x, p.y - 10, 24, ['a', 'y', 'W'], 120, 0.6);
      this.banner.show(t('meta.segundaVida'), 'a');
      ctx.sfx.play('guau', { pitch: 1.2 });
    } else if (p.dead && p.deadFor > DEATH_DELAY) this.finish(false);
  }

  private achieve(id: string): void {
    if (this.earned.has(id) || this.opts.loadout.known.includes(id)) return;
    this.earned.add(id);
    const def = LOGROS.find((l) => l.id === id);
    this.banner.show(t('meta.logro', { nombre: t(`${def?.i18n ?? 'logros.' + id}.nombre`) }), 'a');
    this.ctx.sfx.play('campana', { pitch: 1.3 });
  }

  /** The environment at this kilometre (none in La Antártica). */
  private currentEnv(km = this.journey.km(this.ctx.time)): ReturnType<typeof ambienteAt> {
    return this.journey.antartica ? undefined : ambienteAt(this.journey.zone.id, km);
  }

  private simulate(dt: number, real: number): void {
    const ctx = this.ctx;
    ctx.time += dt;
    this.worldTime += dt;
    const p = ctx.player;
    p.update(dt, this.input.state, ctx);
    ctx.enemies.update(dt, ctx);
    this.weapons.update(dt, ctx);
    this.passives.update(dt, ctx);
    ctx.food.update(dt, ctx);
    ctx.shots.update(dt, ctx);
    ctx.telegraphs.update(dt);
    ctx.clouds.update(dt, ctx);
    this.tutorial.update(dt, ctx);
    this.hazards.update(dt, ctx);
    this.weather.update(dt, ctx.wind.x, ctx.rng);
    this.journey.update(dt, real, ctx);
    if (this.mode === 'end') return;
    this.events.update(dt, ctx, this.journey.bossActive);
    // City scenery: landmark on the horizon, local props on the ground, and the small events.
    const km = this.journey.km(ctx.time);
    if (!this.santiagoSeen && km >= (CIUDADES.find((c) => c.id === 'santiago')?.km ?? Infinity)) {
      this.santiagoSeen = true;
      this.noHitToSantiago = ctx.stats.damageTaken === 0;
    }
    this.cities.update(dt, ctx, km, this.journey.bossActive);
    const city = this.journey.antartica ? null : this.cities.view(km);
    // Environment: floor, horizon colours and weather follow the place (Santiago ≠ the coast).
    const env = this.currentEnv(km);
    if ((env?.id ?? '') !== this.envId) {
      this.envId = env?.id ?? '';
      if (env) {
        this.floor.setFloor(`suelo_${env.floor}`, SUELO_PESOS[env.floor] ?? SUELO_CENTRO_PESOS);
        this.horizon.setZone(env.look, this.viewW);
        this.weather.setZone(env.weather, this.viewW, this.viewH, ctx.rng);
      }
      this.decor.setEnv(this.envId);
    }
    const view = this.camera.viewOrigin(1, this.viewW, this.viewH);
    this.ambient.update(dt, this.envId || this.journey.zone.id, view.x, view.y, this.viewW, this.viewH);
    this.horizon.setLandmark(city?.scene.landmark ?? null, city?.progress ?? 0);
    this.decor.setCityProp(city?.scene.prop ?? null);
    this.spawner.update(dt, ctx, this.viewW, this.viewH, this.journey.zone.id, this.journey.bossActive, this.journey.km(ctx.time));
    ctx.enemies.recycleFar(p.x, p.y, Math.hypot(this.viewW, this.viewH) * 0.9, ctx, this.viewW, this.viewH);

    const speed = Math.hypot(p.vx, p.vy) || 1;
    const spd = p.speed || 1;
    const lead = Math.min(1, speed / spd);
    this.camera.update(dt, p.x, p.y - 8, (p.vx / speed) * lead, (p.vy / speed) * lead);

    let near = 0;
    for (const e of ctx.enemies.list) {
      if (e.active && e.def.id === 'zancudo' && Math.abs(e.x - p.x) < 120 && Math.abs(e.y - p.y) < 90) near++;
    }
    ctx.sfx.setBuzz(near / 12);

    // Music intensity follows the crowd; low health beats like a heart (sound alone tells you).
    this.intensityT -= dt;
    if (this.intensityT <= 0) {
      this.intensityT = 0.4;
      this.music.setIntensity(ctx.enemies.activeCount);
    }
    this.heartbeat -= dt;
    if (!p.dead && p.hp / p.maxHp < 0.25 && this.heartbeat <= 0) {
      this.heartbeat = 0.55 + (p.hp / p.maxHp) * 2;
      ctx.sfx.play('latido');
    }
  }

  // ---------------------------------------------------------------- level up

  private startLevelUp(): void {
    const ctx = this.ctx;
    this.mode = 'slowmo';
    this.slowLeft = LEVEL_UP.slowMoSeconds;
    this.setTimeScale(LEVEL_UP.slowMoScale);
    ctx.screen.levelUp(ctx.player.x, ctx.player.y);
    const shouts = tList('ui.subirNivel');
    this.banner.show(shouts[ctx.rng.int(0, Math.max(0, shouts.length - 1))] ?? '¡Wena!', 'a');
    // Level up: an ascending guitar strum.
    ctx.sfx.play('guitarra');
  }

  private showCards(fresh: boolean): void {
    if (fresh) this.offers = this.ctx.build.offers(this.ctx.rngCards, this.cards);
    this.mode = 'cards';
    this.input.clear();
    this.ctx.sfx.setBuzz(0);
    if (fresh && this.offers.some((o) => o.rarity === 'legendaria')) {
      // Legendary card: a happy accordion and "¡Bacán!".
      this.ctx.sfx.play('acordeon');
      window.setTimeout(() => this.ctx.sfx.play('bacan'), 450);
    } else if (fresh && this.offers.some((o) => o.rarity === 'epica')) {
      // Epic card: a bell.
      this.ctx.sfx.play('campana', { pitch: 1.1 });
    }
    this.showOffers(fresh, this.tutorial.glowFirstCard);
    this.tutorial.cardsShown();
  }

  /** Draws the current offers (with their "Evoluciona" stamps and pillar tags). */
  private showOffers(fresh: boolean, glowFirst = false): void {
    const b = this.ctx.build;
    this.levelUp.show(
      this.offers,
      this.ctx.progress.level,
      this.rerolls,
      this.banishes,
      this.viewW,
      this.viewH,
      fresh,
      this.offers.map((o) => b.completesEvolution(o)),
      glowFirst,
      this.offers.map((o) => pillarLine(o, b)),
    );
  }

  private pick(i: number): void {
    const offer = this.offers[i];
    if (!offer) return;
    this.applyOffer(offer);
    this.ctx.sfx.play('cargaLista', { pitch: 1.5 });
    this.afterCard();
  }

  private applyOffer(offer: Offer): void {
    const woke = applyOffer(this.ctx, offer);
    if (woke) {
      // A pillar bonus just woke up: say which one and what it does.
      this.banner.show(woke.title, 'a', woke.text);
      this.ctx.sfx.play('cargaLista', { pitch: 1.2 });
    }
  }

  private reroll(): void {
    if (this.rerolls <= 0) return;
    this.rerolls--;
    this.offers = this.ctx.build.offers(this.ctx.rngCards, this.offers.length);
    this.showOffers(false);
  }

  private banish(i: number): void {
    const offer = this.offers[i];
    if (!offer || this.banishes <= 0 || offer.kind === 'heal' || offer.kind === 'lucas') return;
    this.banishes--;
    this.ctx.build.banished.add(offer.id);
    this.offers[i] = replacementFor(this.ctx, this.offers);
    this.showOffers(false);
  }

  private skip(): void {
    this.ctx.progress.lucas += LEVEL_UP.skipLucas;
    this.afterCard();
  }

  private afterCard(): void {
    this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    const need = xpToNext(this.ctx.progress.level);
    if (this.ctx.progress.xp >= need) {
      this.ctx.progress.xp -= need;
      this.ctx.progress.level++;
      this.pendingLevels++;
    }
    if (this.pendingLevels > 0) {
      this.showCards(true);
      return;
    }
    this.levelUp.hide();
    this.resume();
  }

  // ---------------------------------------------------------------- caja

  private openCaja(golden: boolean): void {
    const ctx = this.ctx;
    const { rewards, evolution: evo } = rollCaja(ctx, golden);
    if (evo) {
      ctx.banner(t(evo.nameKey), 'a', t('ui.evoluciona'));
      // Cielo del Dieciocho: 20 s of cueca in 6/8 with palmas (GDD "Música").
      if (evo.id === 'cieloDelDieciocho') this.music.startCueca(20);
    }
    this.mode = 'caja';
    this.input.clear();
    ctx.sfx.setBuzz(0);
    ctx.sfx.play('campana');
    this.caja.show(
      rewards,
      golden,
      this.viewW,
      this.viewH,
      () => ctx.sfx.play('ruleta', { pitch: 0.9 + ctx.rng.range(0, 0.3) }),
      () => ctx.sfx.play(evo ? 'evolucion' : 'cargaLista', { pitch: evo ? 1 : 1.3 }),
    );
  }

  // ---------------------------------------------------------------- pause / end

  private togglePause(): void {
    if (this.mode === 'paused') this.resume();
    else if (this.mode === 'playing') this.openPause();
  }

  private openPause(): void {
    if (this.mode !== 'playing') return;
    this.mode = 'paused';
    this.input.clear();
    this.ctx.sfx.setBuzz(0);
    const ctx = this.ctx;
    this.pause.show(
      ctx.build,
      this.viewW,
      this.viewH,
      () => this.resume(),
      () => {
        this.pause.hide();
        this.finish(false);
      },
      () => this.options.show(this.viewW, this.viewH),
      {
        seconds: ctx.time,
        km: this.journey.km(ctx.time),
        kills: ctx.stats.kills,
        level: ctx.progress.level,
        hp: Math.ceil(ctx.player.hp),
        maxHp: ctx.player.maxHp,
      },
    );
  }

  private closeOptions(): void {
    this.options.hide();
  }

  private resume(): void {
    this.pause.hide();
    this.input.clear();
    this.mode = 'playing';
  }

  private finish(victory: boolean): void {
    // Beating Cai Cai Vilú first plays the ending in comic panels.
    if (victory && !this.comic && !this.journey.antartica) {
      this.mode = 'comic';
      this.setTimeScale(1);
      this.ctx.sfx.setBuzz(0);
      this.input.clear();
      this.comic = new ComicScene(null, this.ctx.sfx, 'final', () => {
        if (!this.comic) return;
        this.root.removeChild(this.comic.root);
        this.comic.root.destroy({ children: true });
        this.comic = null;
        this.finishNow(true);
      });
      this.comic.resize(this.viewW, this.viewH);
      this.root.addChild(this.comic.root);
      return;
    }
    this.finishNow(victory);
  }

  private finishNow(victory: boolean): void {
    const ctx = this.ctx;
    if (victory) this.achieve('deAricaAPuntaArenas');
    this.victory = victory;
    this.mode = 'end';
    this.setTimeScale(1);
    ctx.sfx.setBuzz(0);
    // The music stops; the fanfare (or the sad "wah-wah" of the cumbia) says how it went.
    this.music.stop();
    ctx.sfx.play(victory ? 'victoria' : 'derrota');
    const km = this.journey.km(ctx.time);
    const rewards = this.opts.onFinish(
      runResult(ctx, km, this.journey.visited, victory, this.earned, this.reported, {
        character: this.opts.loadout.character.id,
        daily: this.opts.daily?.counted === true,
        noHitToSantiago: this.noHitToSantiago,
      }),
    );
    this.reported = snapshot(ctx, km);
    const info = shareInfo(ctx, this.opts.loadout, this.opts.daily, km, victory);
    const text = shareText(info);
    const daily = this.opts.daily;
    this.end.show(
      {
        victory,
        km,
        city: cityName(km),
        seconds: ctx.time,
        kills: ctx.stats.kills,
        level: ctx.progress.level,
        lucas: rewards.lucas,
        damageBy: ctx.stats.damageBy,
        rewards,
      },
      this.viewW,
      this.viewH,
      () => this.opts.onRestart(),
      () => ctx.sfx.play('moneda', { pitch: 0.9 + ctx.rng.range(0, 0.4) }),
      victory && !this.journey.antartica ? () => this.continueToAntarctica() : undefined,
      this.opts.onCucha ?? undefined,
      () => this.opts.onMenu(),
      { copy: () => this.opts.share.copy(text), share: () => this.opts.share.image(info, text) },
      daily ? t(daily.counted ? 'compartir.rutaHoy' : 'compartir.rutaEtiquetaPractica', { n: daily.number }) : undefined,
    );
  }

  private reported = emptyReport();
  /** Reached Santiago's kilometre without taking damage (for the achievement). */
  private noHitToSantiago = false;
  private santiagoSeen = false;

  /** After beating Cai Cai Vilú: keep going into the endless south. */
  private continueToAntarctica(): void {
    this.end.hide();
    this.victory = false;
    // The old music was stopped at the end screen; entering the zone starts the new one.
    this.journey.continueToAntarctica(this.ctx);
    this.resume();
  }

  get won(): boolean {
    return this.victory;
  }

  render(alpha: number): void {
    const ctx = this.ctx;
    const p = ctx.player;
    const a = this.mode === 'playing' || this.mode === 'slowmo' ? alpha : 1;
    const origin = this.camera.viewOrigin(a, this.viewW, this.viewH);
    this.shaken.position.set(ctx.shake.x, ctx.shake.y);
    this.floor.update(origin.x, origin.y);
    this.worldRoot.position.set(-origin.x, -origin.y);
    this.decor.update(this.mode === 'playing' ? 1 / 60 : 0, origin.x, origin.y, this.viewW, this.viewH);

    p.render(a);
    ctx.enemies.render(a);
    ctx.food.render(a);
    this.weapons.render(a, ctx);
    this.passives.render(a, ctx);
    this.ambient.render();
    ctx.shots.render(a);
    ctx.telegraphs.render();
    ctx.clouds.render(this.worldTime);
    this.journey.draw(a);
    ctx.particles.render();
    ctx.numbers.render();
    const px = Math.round(p.prevX + (p.x - p.prevX) * a);
    const py = Math.round(p.prevY + (p.y - p.prevY) * a);
    this.horizon.update(origin.x, this.worldTime);
    for (const m of this.moais) m.update(1 / 60);
    this.tutorial.render();
    this.weather.render();
    this.hazards.render(px - origin.x + ctx.shake.x, py - 8 - origin.y + ctx.shake.y);
    ctx.screen.render({
      x: px,
      y: py,
      facing: p.facing,
      charge: p.charge,
      holding: p.holding,
      guauCooldown: p.guauCooldown,
      guauCooldownMax: p.guauCooldownMax,
      hpRatio: p.hp / p.maxHp,
      dead: p.dead,
    });
    const km = this.journey.km(ctx.time);
    this.hud.render(
      {
        hp: p.hp,
        maxHp: p.maxHp,
        level: ctx.progress.level,
        xp: ctx.progress.xp,
        xpNext: xpToNext(ctx.progress.level),
        km,
        city: cityName(km),
        seconds: ctx.time,
        kills: ctx.stats.kills,
      },
      ctx.build,
      this.mode === 'playing' ? this.input.stickNative(this.viewW, this.viewH) : null,
      this.journey.bar(),
      this.pointerTo(origin.x, origin.y),
      {
        km,
        antartica: this.journey.antartica,
        touch: this.opts.mobile && this.mode === 'playing',
        holding: this.input.touchHolding || (this.opts.loadout.settings.holdMode === 'alternar' && p.holding),
      },
    );
  }

  /** Screen-edge arrow toward the secret island while it is off screen. */
  private pointerTo(ox: number, oy: number): { x: number; y: number; angle: number } | null {
    const r = this.journey.rapaNui;
    if (!r || r.found) return null;
    const sx = r.x - ox;
    const sy = r.y - oy;
    if (sx > 0 && sx < this.viewW && sy > 0 && sy < this.viewH) return null;
    const cx = this.viewW / 2;
    const cy = this.viewH / 2;
    const angle = Math.atan2(sy - cy, sx - cx);
    const k = Math.min((cx - 14) / Math.abs(Math.cos(angle) || 1e-6), (cy - 14) / Math.abs(Math.sin(angle) || 1e-6));
    return { x: cx + Math.cos(angle) * k, y: cy + Math.sin(angle) * k, angle };
  }
}
