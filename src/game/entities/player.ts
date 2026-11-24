import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { InputState } from '../../core/input.ts';
import { GUAU, VOLANTIN_ORBIT } from '../../data/armas.ts';
import { px } from '../../data/balance.ts';
import { PLAYER_BASE } from '../../data/personajes.ts';
import type { RunContext } from '../context.ts';

/** Short vibration on phones, only after the player has touched the page (browsers block it otherwise). */
function vibrate(ms: number): void {
  if (navigator.userActivation?.hasBeenActive && 'vibrate' in navigator) navigator.vibrate(ms);
}

type AnimName = 'quieto' | 'parpadeo' | 'trotar' | 'cargar' | 'ladrar' | 'dano' | 'muerte';

/** Time to reach full speed and to stop: small, so it feels responsive but soft. */
const ACCEL_TIME = 0.07;
const DECEL_TIME = 0.1;
/** Seconds of "ladrar" / "dano" animation before going back to normal. */
const BARK_ANIM = 0.3;
const HURT_ANIM = 0.2;

/**
 * El Quiltro: movement with soft inertia, health and invulnerability, the
 * ¡GUAU! charge (hold) and bark (release when full), and its animation.
 */
export class Player {
  readonly sprite = new Sprite();
  readonly shadow = new Sprite();
  /** Collision radius (native px). */
  readonly radius = 6;

  x = 0;
  y = 0;
  prevX = 0;
  prevY = 0;
  vx = 0;
  vy = 0;
  facing = 1;
  hp = PLAYER_BASE.maxHp;
  maxHp = PLAYER_BASE.maxHp;
  invulnerable = 0;
  dead = false;

  /** 0..1 while holding (ring around the dog). */
  charge = 0;
  /** Seconds until the next bark is allowed. */
  guauCooldown = 0;
  guauCooldownMax: number = GUAU.cooldown;
  /** True while the hold button is down. */
  holding = false;

  private animName: AnimName = 'quieto';
  private animTime = 0;
  private barkTime = 0;
  private hurtTime = 0;
  private deadTime = 0;
  private blinkIn = 3;
  private blinkLeft = 0;
  private wasHolding = false;
  private chargeTicks = 0;
  private readonly anims: Record<AnimName, Anim>;
  private readonly flashAnims: Record<AnimName, Anim>;

  constructor() {
    const names: AnimName[] = ['quieto', 'parpadeo', 'trotar', 'cargar', 'ladrar', 'dano', 'muerte'];
    this.anims = Object.fromEntries(names.map((n) => [n, anim('quiltro', n)])) as Record<AnimName, Anim>;
    this.flashAnims = Object.fromEntries(names.map((n) => [n, anim('quiltro', `${n}_blanco`)])) as Record<
      AnimName,
      Anim
    >;
    const shadow = anim('sombra', 'grande').textures[0];
    if (shadow) this.shadow.texture = shadow;
    this.shadow.anchor.set(0.5);
  }

  addTo(shadows: Container, world: Container): void {
    shadows.addChild(this.shadow);
    world.addChild(this.sprite);
  }

  /** Passive speed multiplier from the build (Pata de perro). */
  speedMult = 1;
  armor = PLAYER_BASE.armor;
  regen = 0;

  get speed(): number {
    return px(PLAYER_BASE.speed) * this.speedMult * (this.holding ? VOLANTIN_ORBIT.holdSpeedMult : 1);
  }

  /** Applies passives; raising max HP also heals by the same amount. */
  applyMods(ctx: RunContext): void {
    const m = ctx.mods;
    this.speedMult = m.speedMult;
    this.armor = PLAYER_BASE.armor + m.armor;
    this.regen = m.regen;
    const newMax = PLAYER_BASE.maxHp + m.maxHp;
    if (newMax > this.maxHp) this.hp += newMax - this.maxHp;
    this.maxHp = newMax;
    this.hp = Math.min(this.hp, this.maxHp);
  }

  heal(amount: number, ctx: RunContext): void {
    if (this.dead) return;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.hp - before >= 1) {
      ctx.numbers.spawn(this.x, this.y - 22, this.hp - before, 'heal');
    }
  }

  get guauReady(): boolean {
    return this.guauCooldown <= 0;
  }

  update(dt: number, input: InputState, ctx: RunContext): void {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.guauCooldown = Math.max(0, this.guauCooldown - dt);
    this.barkTime = Math.max(0, this.barkTime - dt);
    this.hurtTime = Math.max(0, this.hurtTime - dt);

    if (this.dead) {
      this.vx *= Math.exp(-dt / 0.1);
      this.vy *= Math.exp(-dt / 0.1);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.deadTime += dt;
      return;
    }
    if (this.regen > 0) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);

    // Movement with soft inertia (exponential approach to the target velocity).
    const tx = input.moveX * this.speed;
    const ty = input.moveY * this.speed;
    const moving = Math.hypot(input.moveX, input.moveY) > 0.05;
    const k = 1 - Math.exp(-dt / (moving ? ACCEL_TIME : DECEL_TIME));
    this.vx += (tx - this.vx) * k;
    this.vy += (ty - this.vy) * k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.abs(input.moveX) > 0.15) this.facing = Math.sign(input.moveX);

    // Hold → give line + charge the bark. Release with a full ring → ¡GUAU!
    this.holding = input.hold;
    if (this.holding && this.guauReady) {
      const before = this.charge;
      this.charge = Math.min(1, this.charge + dt / GUAU.chargeTime);
      const ticks = Math.floor(this.charge * 6);
      if (ticks > this.chargeTicks && this.charge < 1) ctx.sfx.play('carga', { pitch: 1 + ticks * 0.12 });
      this.chargeTicks = ticks;
      if (before < 1 && this.charge >= 1) ctx.sfx.play('cargaLista');
    }
    if (!this.holding && this.wasHolding) {
      if (this.charge >= 1 && this.guauReady) this.bark(ctx);
      this.charge = 0;
      this.chargeTicks = 0;
    }
    if (!this.holding) this.charge = 0;
    this.wasHolding = this.holding;

    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 0.12;
      this.blinkIn = 3 + ctx.rng.range(0, 2);
    }
    this.blinkLeft = Math.max(0, this.blinkLeft - dt);

    this.setAnim(this.pickAnim(moving));
  }

  /** Called by enemies on contact. */
  takeDamage(amount: number, fromX: number, fromY: number, ctx: RunContext): void {
    if (this.dead || this.invulnerable > 0 || ctx.debug.invincible) return;
    const dmg = Math.max(1, amount - this.armor);
    this.hp -= dmg;
    ctx.stats.damageTaken += dmg;
    this.invulnerable = PLAYER_BASE.invulnerability;
    this.hurtTime = HURT_ANIM;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    this.vx += ((this.x - fromX) / d) * 90;
    this.vy += ((this.y - fromY) / d) * 90;
    ctx.screen.damageFlash();
    ctx.shake.add(0.35);
    ctx.sfx.hurt();
    ctx.numbers.spawn(this.x, this.y - 18, dmg, 'player');
    vibrate(40);
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.deadTime = 0;
      this.charge = 0;
      this.setAnim('muerte');
      ctx.shake.add(0.6);
    }
  }

  private bark(ctx: RunContext): void {
    const n = ctx.build.numbers('guau', ctx.mods);
    this.guauCooldown = n.cooldown;
    this.guauCooldownMax = n.cooldown;
    this.barkTime = BARK_ANIM;
    this.setAnim('ladrar');
    const radius = px(n.area);
    ctx.enemies.shockwave(this.x, this.y - 8, radius, n.damage, ctx);
    ctx.screen.guau(this.x, this.y, radius);
    ctx.shake.add(0.55);
    ctx.sfx.play('guau', { pitch: 0.95 + ctx.rng.range(0, 0.1) });
    vibrate(60);
  }

  /** Seconds since dying (the run shows the end screen after the animation). */
  get deadFor(): number {
    return this.dead ? this.deadTime : 0;
  }

  /** Second life / debug: back on its feet with `hpRatio` of max HP. */
  revive(ctx: RunContext, hpRatio = 1): void {
    this.dead = false;
    this.hp = this.maxHp * hpRatio;
    this.invulnerable = 2;
    this.setAnim('quieto');
    ctx.enemies.clearAround(this.x, this.y, 200);
  }

  private pickAnim(moving: boolean): AnimName {
    if (this.hurtTime > 0) return 'dano';
    if (this.barkTime > 0) return 'ladrar';
    if (this.holding && this.guauReady && this.charge > 0) return 'cargar';
    if (moving) return 'trotar';
    return this.blinkLeft > 0 ? 'parpadeo' : 'quieto';
  }

  private setAnim(name: AnimName): void {
    if (name === this.animName) return;
    // Trot and idle share the phase so switching does not stutter.
    const keepTime = (name === 'quieto' && this.animName === 'parpadeo') || (name === 'parpadeo' && this.animName === 'quieto');
    this.animName = name;
    if (!keepTime) this.animTime = 0;
  }

  render(alpha: number): void {
    const x = Math.round(this.prevX + (this.x - this.prevX) * alpha);
    const y = Math.round(this.prevY + (this.y - this.prevY) * alpha);
    const flash = this.hurtTime > HURT_ANIM - 0.07;
    const a = (flash ? this.flashAnims : this.anims)[this.animName];
    const tex = a.textures[frameAt(a, this.animTime)];
    if (tex) this.sprite.texture = tex;
    this.sprite.anchor.set(tex?.defaultAnchor?.x ?? 0.5, tex?.defaultAnchor?.y ?? 1);
    this.sprite.scale.x = this.facing;
    this.sprite.position.set(x, y);
    this.sprite.zIndex = y;
    // Blink while invulnerable (every other 60 ms).
    this.sprite.visible = this.dead || this.invulnerable <= 0 || Math.floor(this.invulnerable * 16) % 2 === 0;
    this.shadow.position.set(x, y);
  }
}
