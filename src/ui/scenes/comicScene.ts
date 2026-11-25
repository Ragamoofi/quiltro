import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Sfx } from '../../audio/sfx.ts';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import { t, tList } from '../../i18n/index.ts';
import { PixelText } from '../text.ts';
import { Button, C, panel } from '../widgets.ts';

const PANEL_TIME = 2;

interface Actor {
  sprite: string;
  anim: string;
  /** Position in panel fractions (0..1). */
  x: number;
  y: number;
  scale: number;
  flip?: boolean;
  /** Moves this many fractions over the panel's time (for the kite flying away). */
  dx?: number;
  dy?: number;
}

interface PanelDef {
  sky: string;
  ground: string;
  sea?: boolean;
  actors: Actor[];
  caption: string;
  shake?: boolean;
  /** Kite string: from actor a (hand) to actor b (kite). */
  tether?: [number, number];
}

/**
 * Story told in comic panels, 2 s each, with no reading required (the
 * captions are short). Tap to advance, "Saltar" to skip. Used for the intro
 * (3 panels) and the ending (4 panels).
 */
export class ComicScene implements Scene {
  readonly root = new Container();
  private readonly panels: PanelDef[];
  private readonly onDone: () => void;
  private readonly sfx: Sfx;
  private index = 0;
  private time = 0;
  private actors: { sprite: Sprite; anim: Anim; def: Actor }[] = [];
  private w = 480;
  private h = 270;
  private done = false;
  private frame = { x: 0, y: 0, w: 0, h: 0 };
  private string = new Graphics();

  /** `input` null: the owner forwards keys with next()/finish() (used inside a run). */
  constructor(input: Input | null, sfx: Sfx, kind: 'intro' | 'final', onDone: () => void) {
    this.sfx = sfx;
    this.onDone = onDone;
    this.panels = kind === 'intro' ? introPanels() : finalPanels();
    if (input) {
      for (const code of ['Enter', 'Space', 'GamepadA']) input.onPress(code, () => this.next());
      input.onPress('Escape', () => this.finish());
    }
    this.root.eventMode = 'static';
    this.root.on('pointertap', () => this.next());
  }

  enter(): void {}
  exit(): void {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.build();
  }

  next(): void {
    if (this.index >= this.panels.length - 1) this.finish();
    else {
      this.index++;
      this.time = 0;
      this.build();
    }
  }

  finish(): void {
    if (this.done) return;
    this.done = true;
    this.onDone();
  }

  private build(): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.string = new Graphics();
    const { w, h } = this;
    const p = this.panels[this.index];
    if (!p) return;
    this.root.addChild(new Graphics().rect(0, 0, w, h).fill(C('k')));
    // The panel: a bordered "comic" frame with sky, ground and maybe the sea.
    const fw = Math.min(w - 20, Math.round(h * 1.5));
    const fh = Math.min(h - 50, Math.round(fw * 0.62));
    const fx = Math.round((w - fw) / 2);
    const fy = 12;
    this.frame = { x: fx, y: fy, w: fw, h: fh };
    const g = new Graphics();
    panel(g, fx - 3, fy - 3, fw + 6, fh + 6, 'w', 'k', 'W', 'n');
    g.rect(fx, fy, fw, fh).fill(C(p.sky));
    const horizon = fy + Math.round(fh * 0.62);
    if (p.sea) {
      g.rect(fx, horizon - 10, fw, 10).fill(C('b'));
      for (let x = fx; x < fx + fw; x += 8) g.rect(x + ((x / 8) % 2) * 3, horizon - 6, 3, 1).fill(C('s'));
    }
    g.rect(fx, horizon, fw, fy + fh - horizon).fill(C(p.ground));
    g.rect(fx, horizon, fw, 1).fill(C('k'));
    this.root.addChild(g);

    this.root.addChild(this.string);
    this.actors = p.actors.map((def) => {
      const a = anim(def.sprite, def.anim);
      const s = new Sprite(a.textures[0]);
      s.anchor.set(0.5, 1);
      s.scale.set(def.scale * (def.flip ? -1 : 1), def.scale);
      this.root.addChild(s);
      return { sprite: s, anim: a, def };
    });

    const cap = new PixelText(p.caption, { color: 'w', outline: 'k', maxWidth: Math.floor((w - 20) / 2), align: 'center' }, 2);
    cap.position.set(Math.round((w - cap.width) / 2), fy + fh + 8);
    const skip = new Button(t('menu.saltar'), 44, 14, () => this.finish(), 'K', 'w');
    skip.position.set(w - 50, h - 18);
    this.root.addChild(cap, skip);
    // Little page dots.
    const dots = new Graphics();
    this.panels.forEach((_, i) => dots.rect(8 + i * 6, h - 10, 4, 4).fill(C(i === this.index ? 'a' : 'K')));
    this.root.addChild(dots);
    this.sfx.play('carga', { pitch: 1.2 + this.index * 0.1 });
  }

  update(dt: number): void {
    this.time += dt;
    if (this.time >= PANEL_TIME + (this.index === this.panels.length - 1 ? 1 : 0)) this.next();
  }

  render(): void {
    const p = this.panels[this.index];
    const shake = p?.shake ? Math.round(Math.sin(this.time * 50) * 1) : 0;
    const k = Math.min(1, this.time / PANEL_TIME);
    for (const a of this.actors) {
      const tex = a.anim.textures[frameAt(a.anim, this.time)];
      if (tex) a.sprite.texture = tex;
      const x = this.frame.x + (a.def.x + (a.def.dx ?? 0) * k) * this.frame.w;
      const y = this.frame.y + (a.def.y + (a.def.dy ?? 0) * k) * this.frame.h;
      a.sprite.position.set(Math.round(x) + shake, Math.round(y));
    }
    this.string.clear();
    const tether = p?.tether;
    const from = tether ? this.actors[tether[0]] : undefined;
    const to = tether ? this.actors[tether[1]] : undefined;
    if (from && to) {
      // From the raised hand to the kite's centre.
      const hx = from.sprite.x + 10;
      const hy = from.sprite.y - from.sprite.height + 6;
      const kx = to.sprite.x;
      const ky = to.sprite.y - to.sprite.height / 2;
      this.string.moveTo(hx + 0.5, hy + 0.5).quadraticCurveTo((hx + kx) / 2, (hy + ky) / 2 + 20, kx + 0.5, ky + 0.5).stroke({ width: 1, color: C('w') });
    }
  }
}

function introPanels(): PanelDef[] {
  const cap = tList('intro');
  return [
    {
      sky: 's',
      ground: 'o',
      sea: true,
      caption: cap[0] ?? '',
      tether: [0, 2],
      actors: [
        { sprite: 'martina', anim: 'feliz', x: 0.4, y: 0.85, scale: 2 },
        { sprite: 'quiltro', anim: 'quieto', x: 0.62, y: 0.88, scale: 2, flip: true },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.52, y: 0.22, scale: 2 },
      ],
    },
    {
      sky: 's',
      ground: 'o',
      sea: true,
      caption: cap[1] ?? '',
      actors: [
        { sprite: 'martina', anim: 'llora', x: 0.4, y: 0.85, scale: 2 },
        { sprite: 'quiltro', anim: 'dano', x: 0.62, y: 0.88, scale: 2 },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.52, y: 0.22, scale: 2, dx: 0.45, dy: 0.2 },
      ],
    },
    {
      sky: 'y',
      ground: 'o',
      shake: true,
      caption: cap[2] ?? '',
      actors: [{ sprite: 'quiltro', anim: 'trotar', x: 0.45, y: 0.9, scale: 3 }],
    },
  ];
}

function finalPanels(): PanelDef[] {
  const cap = tList('final');
  return [
    {
      sky: 'i',
      ground: 'G',
      caption: t('zonas.patagonia.titulo'),
      actors: [
        { sprite: 'quiltro', anim: 'quieto', x: 0.45, y: 0.9, scale: 2 },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.6, y: 0.1, scale: 2, dy: 0.62 },
      ],
    },
    {
      sky: 'i',
      ground: 'G',
      caption: cap[0] ?? '...',
      actors: [
        { sprite: 'quiltro', anim: 'quieto', x: 0.5, y: 0.9, scale: 3, flip: true },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.43, y: 0.62, scale: 1 },
      ],
    },
    {
      sky: 's',
      ground: 'o',
      sea: true,
      caption: cap[1] ?? '',
      actors: [
        { sprite: 'martina', anim: 'alegre', x: 0.38, y: 0.85, scale: 2 },
        { sprite: 'quiltro', anim: 'trotar', x: 0.66, y: 0.88, scale: 2, flip: true, dx: -0.12 },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.58, y: 0.6, scale: 1, dx: -0.12 },
      ],
    },
    {
      sky: 'k',
      ground: 'K',
      caption: cap[2] ?? '',
      actors: [
        { sprite: 'quiltro', anim: 'quieto', x: 0.42, y: 0.9, scale: 2 },
        { sprite: 'martina', anim: 'feliz', x: 0.58, y: 0.88, scale: 2 },
        { sprite: 'volantinAzul', anim: 'ondear', x: 0.62, y: 0.25, scale: 2 },
      ],
    },
  ];
}
