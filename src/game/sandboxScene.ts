import { Container, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../art/assets.ts';
import { SUELO_CENTRO_PESOS } from '../art/sprites/suelos.ts';
import { Camera } from '../core/camera.ts';
import type { Input } from '../core/input.ts';
import type { Scene } from '../core/scene.ts';
import { PLAYER_BASE } from '../data/personajes.ts';
import { FloorLayer } from './world/floor.ts';

/**
 * Phase 0 scene: the quiltro trotting on the Centro floor, to prove the pixel
 * pipeline (native resolution, integer scale, fixed step, interpolation, camera).
 * Phase 1 replaces it with the real run scene.
 */
export class SandboxScene implements Scene {
  readonly root = new Container();
  private readonly world = new Container();
  private readonly floor = new FloorLayer('suelo_centro', SUELO_CENTRO_PESOS);
  private readonly camera = new Camera();
  private readonly dog = new Sprite();
  private readonly idle: Anim;
  private readonly trot: Anim;
  private readonly blink: Anim;

  private viewW = 480;
  private viewH = 270;
  private x = 0;
  private y = 0;
  private prevX = 0;
  private prevY = 0;
  private vx = 0;
  private vy = 0;
  private facing = 1;
  private animTime = 0;
  private moving = false;
  private blinkIn = 3;
  private blinkLeft = 0;

  private readonly input: Input;

  constructor(input: Input) {
    this.input = input;
    this.idle = anim('quiltro', 'quieto');
    this.trot = anim('quiltro', 'trotar');
    this.blink = anim('quiltro', 'parpadeo');
    this.root.addChild(this.floor.root, this.world);
    this.world.addChild(this.dog);
  }

  get entityCount(): number {
    return 1;
  }

  enter(): void {
    this.camera.snapTo(this.x, this.y);
  }

  exit(): void {}

  resize(width: number, height: number): void {
    this.viewW = width;
    this.viewH = height;
    this.floor.resize(width, height);
  }

  update(dt: number): void {
    this.input.poll();
    const { moveX, moveY } = this.input.state;
    const speed = PLAYER_BASE.speed;

    // Simple responsive movement; Phase 1 tunes inertia.
    const k = 1 - Math.exp(-dt / 0.05);
    this.vx += (moveX * speed - this.vx) * k;
    this.vy += (moveY * speed - this.vy) * k;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const wasMoving = this.moving;
    this.moving = Math.hypot(moveX, moveY) > 0.1;
    if (this.moving !== wasMoving) this.animTime = 0;
    this.animTime += dt;
    if (Math.abs(moveX) > 0.1) this.facing = Math.sign(moveX);

    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkLeft = 0.12;
      this.blinkIn = 3 + Math.random() * 2;
    }
    this.blinkLeft = Math.max(0, this.blinkLeft - dt);

    this.camera.update(dt, this.x, this.y, this.vx / speed, this.vy / speed);
  }

  render(alpha: number): void {
    const origin = this.camera.viewOrigin(alpha, this.viewW, this.viewH);
    this.floor.update(origin.x, origin.y);

    const a = this.moving ? this.trot : this.blinkLeft > 0 ? this.blink : this.idle;
    const tex = a.textures[frameAt(a, this.animTime)];
    if (tex) this.dog.texture = tex;
    this.dog.anchor.set(tex?.defaultAnchor?.x ?? 0.5, tex?.defaultAnchor?.y ?? 1);
    this.dog.scale.x = this.facing;
    const px = this.prevX + (this.x - this.prevX) * alpha;
    const py = this.prevY + (this.y - this.prevY) * alpha;
    this.dog.position.set(Math.round(px - origin.x), Math.round(py - origin.y));
  }
}
