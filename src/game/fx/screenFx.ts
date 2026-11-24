import { ColorMatrixFilter, Container, Graphics, Sprite, Texture, type Filter } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { colorOf, hexToNumber } from '../../art/palette.ts';
import { px } from '../../data/balance.ts';
import { GUAU } from '../../data/armas.ts';

const C = (ch: string): number => hexToNumber(colorOf(ch)?.hex ?? '#FFFFFF');
const RING_TIME = 0.24;
const BALLOON_TIME = 0.75;

/**
 * Juice that is not tied to one entity: ¡GUAU! shock ring + balloon + inverted
 * frames, the charge ring and cooldown bar around the dog, the red border when
 * hurt and the pulsing dithered vignette at low health.
 */
export class ScreenFx {
  /** Drawn in world space (shakes with the world). */
  readonly world = new Container();
  /** Drawn in screen space (HUD level). */
  readonly screen = new Container();
  reduceFlashes = false;

  private readonly g = new Graphics();
  private readonly border = new Graphics();
  private readonly balloon = new Sprite();
  private readonly vignetteA = new Sprite();
  private readonly vignetteB = new Sprite();
  private readonly invert = new ColorMatrixFilter();
  private target: Container | null = null;

  private ringX = 0;
  private ringY = 0;
  private ringT = -1;
  private balloonT = -1;
  private invertFrames = 0;
  private borderFrames = 0;
  private time = 0;
  private viewW = 480;
  private viewH = 270;

  constructor() {
    const tex = anim('globo_guau', 'globo').textures[0];
    if (tex) this.balloon.texture = tex;
    this.balloon.anchor.set(tex?.defaultAnchor?.x ?? 0.2, 1);
    this.balloon.visible = false;
    this.invert.negative(false);
    this.world.addChild(this.g, this.balloon);
    this.screen.addChild(this.vignetteA, this.vignetteB, this.border);
  }

  /** Container that gets the 2-frame colour inversion. */
  setInvertTarget(c: Container): void {
    this.target = c;
  }

  resize(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
    this.vignetteA.texture = ditherVignette(w, h, 4, 14);
    this.vignetteB.texture = ditherVignette(w, h, 8, 24);
  }

  damageFlash(): void {
    this.borderFrames = 2;
  }

  guau(x: number, y: number): void {
    this.ringX = x;
    this.ringY = y - 8;
    this.ringT = 0;
    this.balloonT = 0;
    if (!this.reduceFlashes) this.invertFrames = 2;
  }

  update(dt: number): void {
    this.time += dt;
    if (this.ringT >= 0) {
      this.ringT += dt;
      if (this.ringT > RING_TIME + 0.12) this.ringT = -1;
    }
    if (this.balloonT >= 0) {
      this.balloonT += dt;
      if (this.balloonT > BALLOON_TIME) this.balloonT = -1;
    }
  }

  render(p: {
    x: number;
    y: number;
    facing: number;
    charge: number;
    holding: boolean;
    guauCooldown: number;
    hpRatio: number;
    dead: boolean;
  }): void {
    const g = this.g;
    g.clear();

    // Shock ring: fast ease-out expansion, white then sky blue, 2 px thick.
    if (this.ringT >= 0) {
      const k = Math.min(1, this.ringT / RING_TIME);
      const r = Math.round(px(GUAU.radius) * (1 - (1 - k) ** 3));
      const color = k < 0.6 ? C('W') : C('s');
      g.circle(this.ringX, this.ringY, r).stroke({ width: 2, color });
      if (r > 14) g.circle(this.ringX, this.ringY, r - 8).stroke({ width: 1, color: C('b') });
    }

    // Balloon pops above the head with a 2 px bounce.
    this.balloon.visible = this.balloonT >= 0;
    if (this.balloonT >= 0) {
      const bounce = this.balloonT < 0.06 ? -3 : this.balloonT < 0.12 ? 1 : 0;
      this.balloon.position.set(p.x + p.facing * 4, p.y - 24 + bounce);
    }

    if (!p.dead) {
      // Charge ring: pixels around the dog fill clockwise; blinks when full.
      if (p.holding && p.guauCooldown <= 0 && p.charge > 0) {
        const cx = p.x;
        const cy = p.y - 10;
        const r = 15;
        const full = p.charge >= 1;
        const color = full ? (Math.floor(this.time * 12) % 2 === 0 ? C('W') : C('a')) : C('a');
        const steps = 48;
        const lit = Math.floor(steps * p.charge);
        for (let i = 0; i < steps; i++) {
          const a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
          const x = Math.round(cx + Math.cos(a) * r);
          const y = Math.round(cy + Math.sin(a) * r * 0.8);
          g.rect(x, y, 1, 1).fill(i < lit ? color : C('K'));
        }
      }
      // Cooldown bar under the dog.
      if (p.guauCooldown > 0) {
        const w = 14;
        const fill = Math.round(w * (1 - p.guauCooldown / GUAU.cooldown));
        const x = p.x - w / 2;
        const y = p.y + 3;
        g.rect(x - 1, y - 1, w + 2, 4).fill(C('k'));
        g.rect(x, y, w, 2).fill(C('K'));
        if (fill > 0) g.rect(x, y, fill, 2).fill(C('s'));
      }
    }

    // Red border for 2 frames when hurt.
    const b = this.border;
    b.clear();
    if (this.borderFrames > 0) {
      this.borderFrames--;
      b.rect(0, 0, this.viewW, this.viewH).stroke({ width: 4, color: C('r'), alignment: 1 });
    }

    // Low health (< 25 %): dithered vignette that "beats" between two densities.
    const low = !p.dead && p.hpRatio < 0.25;
    const beat = Math.floor(this.time * 2.4) % 2 === 0;
    this.vignetteA.visible = low && !beat;
    this.vignetteB.visible = low && beat;

    // Inverted colours for 2 frames on ¡GUAU!
    if (this.target) {
      if (this.invertFrames > 0) {
        this.target.filters = [this.invert as Filter];
        this.invertFrames--;
      } else if (this.target.filters) {
        this.target.filters = null;
      }
    }
  }
}

/** Ordered-dither red frame: dense near the edge, sparse toward `outer`. */
function ditherVignette(w: number, h: number, inner: number, outer: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  ctx.fillStyle = colorOf('R')?.hex ?? '#9E1F35';
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (e >= outer) continue;
      const density = e < inner ? 0.55 - (e / inner) * 0.25 : 0.3 * (1 - (e - inner) / (outer - inner));
      const threshold = ((bayer[(y % 4) * 4 + (x % 4)] ?? 0) + 0.5) / 16;
      if (density > threshold) ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}
