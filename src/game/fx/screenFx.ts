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
  private ringR = 100;
  private columnX = 0;
  private columnY = 0;
  private columnT = 0;
  private balloonT = -1;
  private invertFrames = 0;
  private borderFrames = 0;
  private time = 0;
  private viewW = 480;
  private viewH = 270;
  private blackoutT = 0;
  private howlT = 0;
  private readonly dark = new Sprite();
  private readonly howlers: Sprite[] = [];

  constructor() {
    const tex = anim('globo_guau', 'globo').textures[0];
    if (tex) this.balloon.texture = tex;
    this.balloon.anchor.set(tex?.defaultAnchor?.x ?? 0.2, 1);
    this.balloon.visible = false;
    this.invert.negative(false);
    this.world.addChild(this.g, this.balloon);
    const sil = anim('quiltro', 'silueta').textures[0];
    for (let i = 0; i < 6; i++) {
      const s = new Sprite(sil);
      s.anchor.set(0.5, 1);
      s.visible = false;
      this.howlers.push(s);
    }
    this.dark.visible = false;
    this.screen.addChild(this.dark, ...this.howlers, this.vignetteA, this.vignetteB, this.border);
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
    this.dark.texture = ditherVignette(w, h, Math.max(w, h), Math.max(w, h) + 1, 'k', 0.5);
  }

  /** Pixel column of light on the dog when levelling up. */
  levelUp(x: number, y: number): void {
    this.columnX = x;
    this.columnY = y;
    this.columnT = 0.5;
  }

  /** Apagón: the screen goes dark for a moment. */
  blackout(seconds: number): void {
    this.blackoutT = Math.max(this.blackoutT, seconds);
  }

  /** Aullido de las 12: dog silhouettes howl along the bottom of the screen. */
  howl(): void {
    this.howlT = 1.2;
  }

  damageFlash(): void {
    this.borderFrames = 2;
  }

  guau(x: number, y: number, radius: number = px(GUAU.radius)): void {
    this.ringR = radius;
    this.ringX = x;
    this.ringY = y - 8;
    this.ringT = 0;
    this.balloonT = 0;
    if (!this.reduceFlashes) this.invertFrames = 2;
  }

  /** Real seconds (keeps animating in slow motion). */
  updateReal(dt: number): void {
    this.columnT = Math.max(0, this.columnT - dt);
  }

  update(dt: number): void {
    this.time += dt;
    this.blackoutT = Math.max(0, this.blackoutT - dt);
    this.howlT = Math.max(0, this.howlT - dt);
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
    guauCooldownMax: number;
    hpRatio: number;
    dead: boolean;
  }): void {
    const g = this.g;
    g.clear();

    // Shock ring: fast ease-out expansion, white then sky blue, 2 px thick.
    if (this.ringT >= 0) {
      const k = Math.min(1, this.ringT / RING_TIME);
      const r = Math.round(this.ringR * (1 - (1 - k) ** 3));
      const color = k < 0.6 ? C('W') : C('s');
      g.circle(this.ringX, this.ringY, r).stroke({ width: 2, color });
      if (r > 14) g.circle(this.ringX, this.ringY, r - 8).stroke({ width: 1, color: C('b') });
    }

    // Level-up column of light: white core, yellow edges, narrowing as it fades.
    if (this.columnT > 0) {
      const w = Math.max(2, Math.round(this.columnT * 20));
      const x = Math.round(this.columnX - w / 2);
      const top = this.columnY - 400;
      g.rect(x - 1, top, w + 2, 400).fill(C('y'));
      g.rect(x, top, w, 400).fill(C('W'));
      for (let i = 0; i < 6; i++) {
        const sx = this.columnX + Math.round(Math.sin(this.time * 9 + i * 2) * 10);
        const sy = this.columnY - ((this.time * 120 + i * 30) % 120);
        g.rect(Math.round(sx), Math.round(sy), 1, 1).fill(C('a'));
      }
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
        const fill = Math.round(w * (1 - p.guauCooldown / p.guauCooldownMax));
        const x = p.x - w / 2;
        const y = p.y + 3;
        g.rect(x - 1, y - 1, w + 2, 4).fill(C('k'));
        g.rect(x, y, w, 2).fill(C('K'));
        if (fill > 0) g.rect(x, y, fill, 2).fill(C('s'));
      }
    }

    this.dark.visible = this.blackoutT > 0;
    this.howlers.forEach((s, i) => {
      s.visible = this.howlT > 0;
      const rise = Math.min(1, (1.2 - this.howlT) * 6) * Math.min(1, this.howlT * 6);
      s.position.set(Math.round(((i + 0.5) / this.howlers.length) * this.viewW), Math.round(this.viewH + 22 - rise * 22));
      s.scale.x = i % 2 === 0 ? 1 : -1;
    });

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

/** A soft frame of colour along the edges (low health), or a flat translucent cover (`flat`, blackout). */
function ditherVignette(w: number, h: number, inner: number, outer: number, color = 'R', flat = 0): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  const hex = colorOf(color)?.hex ?? '#9E1F35';
  if (flat > 0) {
    ctx.globalAlpha = flat;
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, w, h);
  } else {
    // Four gradients, one per edge: strong at the border, gone at `outer` px.
    const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number): void => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, hex + 'aa');
      g.addColorStop(Math.min(0.99, inner / outer), hex + '55');
      g.addColorStop(1, hex + '00');
      ctx.fillStyle = g;
      ctx.fillRect(rx, ry, rw, rh);
    };
    edge(0, 0, outer, 0, 0, 0, outer, h);
    edge(w, 0, w - outer, 0, w - outer, 0, outer, h);
    edge(0, 0, 0, outer, 0, 0, w, outer);
    edge(0, h, 0, h - outer, 0, h - outer, w, outer);
  }
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'linear';
  return tex;
}
