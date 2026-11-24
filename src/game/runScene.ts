import { Container } from 'pixi.js';
import { SUELO_CENTRO_PESOS } from '../art/sprites/suelos.ts';
import type { Sfx } from '../audio/sfx.ts';
import { Camera } from '../core/camera.ts';
import type { Input } from '../core/input.ts';
import { Rng } from '../core/rng.ts';
import type { Scene } from '../core/scene.ts';
import { ENEMY_CAP } from '../data/balance.ts';
import { Hud } from '../ui/hud.ts';
import type { RunContext } from './context.ts';
import { Enemies } from './entities/enemies.ts';
import { Food } from './entities/food.ts';
import { Kites } from './entities/kites.ts';
import { Player } from './entities/player.ts';
import { DamageNumbers } from './fx/damageNumbers.ts';
import { Particles } from './fx/particles.ts';
import { ScreenFx } from './fx/screenFx.ts';
import { Shake } from './fx/shake.ts';
import { SpatialGrid } from './systems/spatialGrid.ts';
import { Spawner } from './systems/spawner.ts';
import { Decor } from './world/decor.ts';
import { FloorLayer } from './world/floor.ts';

const ENEMY_POOL = 320;

/**
 * A run on the Centro floor. Phase 1: the dog, kites, ¡GUAU!, zancudos and
 * pigeons with all the juice. Layers (back to front): floor, shadows, food,
 * y-sorted world (decor, enemies, dog), kites, overhead cables, particles,
 * numbers, world fx — then the screen fx and HUD, which do not shake.
 */
export class RunScene implements Scene {
  readonly root = new Container();
  readonly ctx: RunContext;
  readonly spawner = new Spawner();

  private readonly shaken = new Container();
  private readonly worldRoot = new Container();
  private readonly shadows = new Container();
  private readonly sorted = new Container();
  private readonly floor = new FloorLayer('suelo_centro', SUELO_CENTRO_PESOS);
  private readonly camera = new Camera();
  private readonly decor: Decor;
  private readonly hud = new Hud();
  private readonly input: Input;
  private viewW = 480;
  private viewH = 270;
  private freeze = 0;

  constructor(input: Input, sfx: Sfx, seed: number, mobile: boolean) {
    this.input = input;
    this.sorted.sortableChildren = true;
    this.decor = new Decor(this.sorted);

    const player = new Player();
    const enemies = new Enemies(ENEMY_POOL, this.shadows, this.sorted);
    const food = new Food();
    const kites = new Kites();
    const particles = new Particles();
    const numbers = new DamageNumbers();
    const screen = new ScreenFx();
    player.addTo(this.shadows, this.sorted);

    this.ctx = {
      rng: new Rng(seed),
      sfx,
      particles,
      numbers,
      shake: new Shake(),
      screen,
      grid: new SpatialGrid(64),
      player,
      enemies,
      kites,
      food,
      time: 0,
      stats: { kills: 0, food: 0, damageTaken: 0 },
      hitstop: (s) => {
        this.freeze = Math.max(this.freeze, s);
      },
      debug: { invincible: false, hitboxes: false },
    };
    this.spawner.cap = mobile ? ENEMY_CAP.mobile : ENEMY_CAP.desktop;

    this.worldRoot.addChild(
      this.shadows,
      food.root,
      this.sorted,
      kites.root,
      this.decor.overhead,
      particles.root,
      numbers.root,
      screen.world,
    );
    this.shaken.addChild(this.floor.root, this.worldRoot);
    this.root.addChild(this.shaken, screen.screen, this.hud.root);
    screen.setInvertTarget(this.shaken);
  }

  enter(): void {
    this.camera.snapTo(this.ctx.player.x, this.ctx.player.y);
  }

  exit(): void {
    this.ctx.sfx.setBuzz(0);
  }

  resize(width: number, height: number): void {
    this.viewW = width;
    this.viewH = height;
    this.floor.resize(width, height);
    this.ctx.screen.resize(width, height);
    this.hud.resize(width);
  }

  update(dt: number): void {
    this.input.poll();
    const ctx = this.ctx;
    ctx.shake.update(dt);
    ctx.screen.update(dt);
    ctx.particles.update(dt);
    ctx.numbers.update(dt);
    // Hit-stop: the world freezes, juice keeps animating.
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    ctx.time += dt;
    const p = ctx.player;
    p.update(dt, this.input.state, ctx);
    ctx.enemies.update(dt, ctx);
    ctx.kites.update(dt, ctx);
    ctx.food.update(dt, ctx);
    this.spawner.update(dt, ctx, this.viewW, this.viewH);
    ctx.enemies.recycleFar(p.x, p.y, Math.hypot(this.viewW, this.viewH) * 0.9, ctx, this.viewW, this.viewH);

    const speed = Math.hypot(p.vx, p.vy) || 1;
    const spd = p.speed || 1;
    this.camera.update(dt, p.x, p.y - 8, (p.vx / speed) * Math.min(1, speed / spd), (p.vy / speed) * Math.min(1, speed / spd));

    // Mosquito drone follows how many zancudos are close.
    let near = 0;
    for (const e of ctx.enemies.list) {
      if (e.active && e.def.id === 'zancudo' && Math.abs(e.x - p.x) < 120 && Math.abs(e.y - p.y) < 90) near++;
    }
    ctx.sfx.setBuzz(near / 12);
  }

  render(alpha: number): void {
    const ctx = this.ctx;
    const p = ctx.player;
    const origin = this.camera.viewOrigin(alpha, this.viewW, this.viewH);
    this.shaken.position.set(ctx.shake.x, ctx.shake.y);
    this.floor.update(origin.x, origin.y);
    this.worldRoot.position.set(-origin.x, -origin.y);
    this.decor.update(1 / 60, origin.x, origin.y, this.viewW, this.viewH);

    p.render(alpha);
    ctx.enemies.render(alpha);
    ctx.food.render(alpha);
    const px = Math.round(p.prevX + (p.x - p.prevX) * alpha);
    const py = Math.round(p.prevY + (p.y - p.prevY) * alpha);
    ctx.kites.render(alpha, px, py, !p.dead);
    ctx.particles.render();
    ctx.numbers.render();
    ctx.screen.render({
      x: px,
      y: py,
      facing: p.facing,
      charge: p.charge,
      holding: p.holding,
      guauCooldown: p.guauCooldown,
      hpRatio: p.hp / p.maxHp,
      dead: p.dead,
    });
    this.hud.render(p.hp, p.maxHp, ctx.stats.kills, ctx.stats.food, this.input.stickNative(this.viewW, this.viewH));
  }
}
