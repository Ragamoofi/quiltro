import { Container } from 'pixi.js';
import { SUELO_CENTRO_PESOS, SUELO_PESOS } from '../art/sprites/suelos.ts';
import type { Sfx } from '../audio/sfx.ts';
import { Camera } from '../core/camera.ts';
import type { Input } from '../core/input.ts';
import { Rng } from '../core/rng.ts';
import type { Scene } from '../core/scene.ts';
import { CAJA, ENEMY_CAP, LEVEL_UP, lucasForRun, PICKUPS, xpToNext } from '../data/balance.ts';
import { CIUDADES } from '../data/zonas.ts';
import { t, tList } from '../i18n/index.ts';
import { Banner } from '../ui/banner.ts';
import { CajaView } from '../ui/cajaView.ts';
import { LUCAS_CARD } from '../ui/cardText.ts';
import { EndScreen } from '../ui/endScreen.ts';
import { Hud } from '../ui/hud.ts';
import { LevelUpView } from '../ui/levelUp.ts';
import { PauseView } from '../ui/pauseView.ts';
import { Build, type Offer } from './build.ts';
import type { RunContext } from './context.ts';
import { Enemies } from './entities/enemies.ts';
import { Food } from './entities/food.ts';
import { Player } from './entities/player.ts';
import { DamageNumbers } from './fx/damageNumbers.ts';
import { Particles } from './fx/particles.ts';
import { ScreenFx } from './fx/screenFx.ts';
import { Shake } from './fx/shake.ts';
import { Journey } from './journey.ts';
import { Clouds } from './systems/clouds.ts';
import { EnemyShots } from './systems/enemyShots.ts';
import { SpatialGrid } from './systems/spatialGrid.ts';
import { Spawner } from './systems/spawner.ts';
import { Telegraphs } from './systems/telegraphs.ts';
import { WeaponSet } from './weapons/index.ts';
import { Decor } from './world/decor.ts';
import { FloorLayer } from './world/floor.ts';
import { Hazards } from './world/hazards.ts';
import { Horizon } from './world/horizon.ts';
import { Weather } from './world/weather.ts';

const ENEMY_POOL = 320;
/** Seconds of the death animation before the end screen. */
const DEATH_DELAY = 1.6;

type Mode = 'playing' | 'slowmo' | 'cards' | 'caja' | 'paused' | 'end';

export interface RunOptions {
  seed: number;
  mobile: boolean;
  setTimeScale: (v: number) => void;
  onRestart: () => void;
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
  private readonly weather = new Weather();
  private readonly hazards = new Hazards();
  private timeScale = 1;
  private worldTime = 0;

  constructor(input: Input, sfx: Sfx, opts: RunOptions) {
    this.input = input;
    this.opts = opts;
    this.sorted.sortableChildren = true;
    this.decor = new Decor(this.sorted);
    this.hud = new Hud(() => this.openPause());

    const player = new Player();
    const enemies = new Enemies(ENEMY_POOL, this.shadows, this.sorted);
    const food = new Food();
    const particles = new Particles();
    const numbers = new DamageNumbers();
    const screen = new ScreenFx();
    const build = new Build('volantin');
    player.addTo(this.shadows, this.sorted);

    const ctx: RunContext = {
      rng: new Rng(opts.seed),
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
      stats: { kills: 0, food: 0, damageTaken: 0, damageBy: {}, killsBy: {}, bossesBeaten: [], temblorQuieto: false },
      progress: { level: 1, xp: 0, lucas: 0, bosses: 0 },
      onKill: (_e, source) => {
        // Cielo del Dieciocho: every enemy cut by a kite heals 1.
        if (source === 'volantin' && build.evolved.has('volantin')) player.heal(1, ctx);
      },
      hitstop: (s) => {
        this.freeze = Math.max(this.freeze, s);
      },
      banner: (text, color, subtitle) => this.banner.show(text, color, subtitle),
      openCaja: (golden) => this.openCaja(golden),
      debug: { invincible: false, hitboxes: false },
    };
    this.ctx = ctx;
    ctx.refreshMods();
    this.spawner.cap = opts.mobile ? ENEMY_CAP.mobile : ENEMY_CAP.desktop;

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
        this.hazards.setZone(z.hazard, ctx);
      },
      onVictory: () => this.finish(true),
      setTimeScale: (v) => this.setTimeScale(v),
      addBoss: (root) => this.sorted.addChild(root),
      setHalfFog: (side) => {
        this.hazards.halfFogSide = side;
      },
    });

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
      this.levelUp.root,
      this.caja.root,
      this.pause.root,
      this.end.root,
    );
    screen.setInvertTarget(this.shaken);

    input.onPress('Escape', () => this.togglePause());
    input.onPress('KeyP', () => this.togglePause());
    input.onPress('KeyR', () => {
      if (this.mode === 'end') this.opts.onRestart();
    });
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((code, i) => input.onPress(code, () => this.levelUp.pressNumber(i)));
    input.onPress('Enter', () => {
      if (this.mode === 'caja') this.caja.tap();
      if (this.mode === 'end') this.opts.onRestart();
    });
  }

  enter(): void {
    this.camera.snapTo(this.ctx.player.x, this.ctx.player.y);
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
    this.horizon.setZone(this.journey.zone.id, width);
    this.weather.setZone(this.journey.zone.id, width, height, this.ctx.rng);
    if (this.mode === 'cards') this.showCards(false);
  }

  get currentMode(): Mode {
    return this.mode;
  }

  // ---------------------------------------------------------------- update

  update(dt: number): void {
    this.input.poll();
    const ctx = this.ctx;
    const real = dt / Math.max(0.05, this.timeScale);
    this.banner.update(real);
    ctx.screen.updateReal(real);
    this.levelUp.update(real);
    this.caja.update(real);
    this.end.update(real);

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
    // End of the road (victory comes from beating El Gran Temblor).
    const p = ctx.player;
    if (p.dead && p.deadFor > DEATH_DELAY) this.finish(false);
  }

  private simulate(dt: number, real: number): void {
    const ctx = this.ctx;
    ctx.time += dt;
    this.worldTime += dt;
    const p = ctx.player;
    p.update(dt, this.input.state, ctx);
    ctx.enemies.update(dt, ctx);
    this.weapons.update(dt, ctx);
    ctx.food.update(dt, ctx);
    ctx.shots.update(dt, ctx);
    ctx.telegraphs.update(dt);
    ctx.clouds.update(dt, ctx);
    this.hazards.update(dt, ctx);
    this.weather.update(dt, ctx.wind.x, ctx.rng);
    this.journey.update(dt, real, ctx);
    if (this.mode === 'end') return;
    this.spawner.update(dt, ctx, this.viewW, this.viewH, this.journey.zone.id, this.journey.bossActive);
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
    ctx.sfx.play('cargaLista', { pitch: 1.2 });
  }

  private showCards(fresh: boolean): void {
    if (fresh) this.offers = this.ctx.build.offers(this.ctx.rng, LEVEL_UP.cards);
    this.mode = 'cards';
    this.input.clear();
    this.ctx.sfx.setBuzz(0);
    if (this.offers.some((o) => o.rarity === 'legendaria')) this.ctx.sfx.play('cargaLista', { pitch: 2 });
    this.levelUp.show(
      this.offers,
      this.ctx.progress.level,
      this.rerolls,
      this.banishes,
      this.viewW,
      this.viewH,
      fresh,
      this.offers.map((o) => this.ctx.build.completesEvolution(o)),
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
    const ctx = this.ctx;
    if (offer.kind === 'heal') ctx.player.heal(PICKUPS.moteConHuesillo.heal, ctx);
    else if (offer.kind === 'lucas') ctx.progress.lucas += LUCAS_CARD;
    else ctx.build.apply(offer);
    ctx.refreshMods();
  }

  private reroll(): void {
    if (this.rerolls <= 0) return;
    this.rerolls--;
    this.offers = this.ctx.build.offers(this.ctx.rng, this.offers.length);
    this.levelUp.show(this.offers, this.ctx.progress.level, this.rerolls, this.banishes, this.viewW, this.viewH, false);
  }

  private banish(i: number): void {
    const offer = this.offers[i];
    if (!offer || this.banishes <= 0 || offer.kind === 'heal' || offer.kind === 'lucas') return;
    this.banishes--;
    this.ctx.build.banished.add(offer.id);
    const taken = new Set(this.offers.map((o) => ('id' in o ? o.id : o.kind)));
    const replacement = this.ctx.build
      .offers(this.ctx.rng, 6)
      .find((o) => !taken.has('id' in o ? o.id : o.kind));
    this.offers[i] = replacement ?? { kind: 'lucas', rarity: 'comun' };
    this.levelUp.show(this.offers, this.ctx.progress.level, this.rerolls, this.banishes, this.viewW, this.viewH, false);
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
    const roll = ctx.rng.weighted(CAJA.rewards.map((r) => r.chance));
    let count: number = CAJA.rewards[roll]?.count ?? 1;
    if (golden) count = Math.max(3, count);
    const rewards: Offer[] = [];
    // An evolution, if one is ready, always comes out first.
    const evo = ctx.build.evolutionReady();
    if (evo) {
      const offer: Offer = { kind: 'evolution', id: evo.weapon, evolution: evo.id, rarity: 'legendaria' };
      ctx.build.apply(offer);
      rewards.push(offer);
      count = Math.max(1, count - 1);
      ctx.banner(t(evo.nameKey), 'a', t('ui.evoluciona'));
    }
    for (let i = 0; i < count; i++) {
      const offer = ctx.build.offers(ctx.rng, 1)[0];
      if (!offer) break;
      ctx.build.apply(offer);
      rewards.push(offer);
    }
    ctx.refreshMods();
    this.mode = 'caja';
    this.input.clear();
    ctx.sfx.setBuzz(0);
    ctx.sfx.play('campana');
    this.caja.show(
      rewards,
      golden,
      this.viewW,
      this.viewH,
      () => ctx.sfx.play('carga', { pitch: 2 }),
      () => ctx.sfx.play('cargaLista', { pitch: 1.3 }),
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
    this.pause.show(this.ctx.build, this.viewW, this.viewH, () => this.resume(), () => {
      this.pause.hide();
      this.finish(false);
    });
  }

  private resume(): void {
    this.pause.hide();
    this.input.clear();
    this.mode = 'playing';
  }

  private finish(victory: boolean): void {
    const ctx = this.ctx;
    this.victory = victory;
    this.mode = 'end';
    this.setTimeScale(1);
    ctx.sfx.setBuzz(0);
    const km = this.journey.km(ctx.time);
    this.end.show(
      {
        victory,
        km,
        city: this.cityAt(km),
        seconds: ctx.time,
        kills: ctx.stats.kills,
        level: ctx.progress.level,
        lucas: lucasForRun(km, ctx.stats.kills, ctx.progress.bosses) + ctx.progress.lucas,
        damageBy: ctx.stats.damageBy,
      },
      this.viewW,
      this.viewH,
      () => this.opts.onRestart(),
      () => ctx.sfx.play('comida', { pitch: 1.5 + ctx.rng.range(0, 0.3) }),
      victory && !this.journey.antartica ? () => this.continueToAntarctica() : undefined,
    );
  }

  /** After beating El Gran Temblor: keep going into the endless south. */
  private continueToAntarctica(): void {
    this.end.hide();
    this.victory = false;
    this.journey.continueToAntarctica(this.ctx);
    this.resume();
  }

  get won(): boolean {
    return this.victory;
  }

  private cityAt(km: number): string {
    let city = CIUDADES[0];
    for (const c of CIUDADES) if (km >= c.km) city = c;
    return city ? t(city.i18n) : '';
  }

  // ---------------------------------------------------------------- render

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
    ctx.shots.render(a);
    ctx.telegraphs.render();
    ctx.clouds.render(this.worldTime);
    this.journey.draw(a);
    ctx.particles.render();
    ctx.numbers.render();
    const px = Math.round(p.prevX + (p.x - p.prevX) * a);
    const py = Math.round(p.prevY + (p.y - p.prevY) * a);
    this.horizon.update(origin.x, this.worldTime);
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
        city: this.cityAt(km),
        seconds: ctx.time,
        kills: ctx.stats.kills,
      },
      ctx.build,
      this.mode === 'playing' ? this.input.stickNative(this.viewW, this.viewH) : null,
      this.journey.bar(),
    );
  }
}
