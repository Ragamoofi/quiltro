import { Container, Sprite, Texture, TilingSprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import { colorOf } from '../../art/palette.ts';

const W = 480;
export const HORIZON_H = 34;

interface Look {
  sky: string;
  stars?: readonly string[];
  far: string;
  near: string;
  cap?: string;
  /** Shape of the near range: soft hills, sharp cones (volcanoes) or towers. */
  shape: 'cerros' | 'cordillera' | 'volcanes' | 'torres' | 'hielo';
  aurora?: readonly string[];
}

const LOOKS: Record<string, Look> = {
  norte: { sky: 'k', stars: ['w', 'y', 'G'], far: 'R', near: 'O', shape: 'cerros' },
  centro: { sky: 's', far: 'g', near: 'K', cap: 'w', shape: 'cordillera' },
  sur: { sky: 'G', far: 'g', near: 'F', cap: 'w', shape: 'volcanes' },
  patagonia: { sky: 's', far: 'i', near: 'K', cap: 'W', shape: 'torres' },
  antartica: { sky: 'k', stars: ['w', 'i'], far: 'I', near: 'i', shape: 'hielo', aurora: ['t', 'v', 'V'] },
};

/**
 * The far landscape of each zone, two parallax layers along the top of the
 * screen behind the HUD: red hills and a starry sky in the north, the snowy
 * cordillera over Santiago, volcanoes in the south, granite towers and
 * glaciers in Patagonia, auroras in Antarctica.
 */
export class Horizon {
  readonly root = new Container();
  private far: TilingSprite | null = null;
  private near: TilingSprite | null = null;
  private zone = '';
  private viewW = W;
  private landmark: Sprite | null = null;
  private landmarkName = '';

  /**
   * A city's landmark crossing the horizon: `progress` 0 puts it just off the right edge,
   * 1 just off the left one. Pass null when no city is near.
   */
  setLandmark(name: string | null, progress: number): void {
    if (!name) {
      if (this.landmark) this.landmark.visible = false;
      return;
    }
    if (!this.landmark || this.landmarkName !== name) {
      this.landmark?.destroy();
      const tex = anim(name, 'quieto').textures[0];
      this.landmark = new Sprite(tex);
      this.landmark.anchor.set(0, 1);
      this.landmarkName = name;
      this.root.addChild(this.landmark);
    }
    const s = this.landmark;
    s.visible = true;
    s.position.set(Math.round(this.viewW + 4 - progress * (this.viewW + s.width + 8)), HORIZON_H);
  }

  setZone(zone: string, viewW: number): void {
    if (zone === this.zone && this.far && this.far.width === viewW) return;
    this.zone = zone;
    this.viewW = viewW;
    this.landmark = null;
    this.landmarkName = '';
    this.root.removeChildren().forEach((c) => c.destroy());
    const look = LOOKS[zone] ?? LOOKS.centro;
    if (!look) return;
    this.far = new TilingSprite({ texture: layer(look, 'far'), width: viewW, height: HORIZON_H });
    this.near = new TilingSprite({ texture: layer(look, 'near'), width: viewW, height: HORIZON_H });
    this.root.addChild(this.far, this.near);
  }

  /** camX: camera world x (whole pixels). */
  update(camX: number, time: number): void {
    if (this.far) this.far.tilePosition.x = -Math.round(camX * 0.04 + time * 2);
    if (this.near) this.near.tilePosition.x = -Math.round(camX * 0.12);
  }
}

/** Seamless 480×34 layer drawn pixel by pixel. */
function layer(look: Look, which: 'far' | 'near'): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = HORIZON_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  const put = (ch: string, x: number, y: number): void => {
    ctx.fillStyle = colorOf(ch)?.hex ?? '#000000';
    ctx.fillRect(x, y, 1, 1);
  };
  // Periodic noise so the strip tiles seamlessly.
  const wave = (x: number, f: number[], a: number[]): number =>
    f.reduce((s, fi, i) => s + Math.sin((x / W) * Math.PI * 2 * fi + i * 1.7) * (a[i] ?? 0), 0);

  if (which === 'far') {
    for (let y = 0; y < HORIZON_H; y++) for (let x = 0; x < W; x++) put(look.sky, x, y);
    if (look.stars) {
      for (let i = 0; i < 70; i++) {
        const x = (i * 97) % W;
        const y = (i * 37) % 18;
        put(look.stars[i % look.stars.length] ?? 'w', x, y);
      }
    }
    if (look.aurora) {
      for (let x = 0; x < W; x++) {
        const y0 = 6 + Math.round(wave(x, [3, 7], [3, 1.5]));
        look.aurora.forEach((c, i) => {
          if ((x + i) % 2 === 0) put(c, x, y0 + i * 2);
          put(c, x, y0 + i * 2 + 1);
        });
      }
    }
    for (let x = 0; x < W; x++) {
      const h = 14 + Math.round(wave(x, [4, 9, 15], [4, 2, 1]));
      for (let y = HORIZON_H - h; y < HORIZON_H; y++) put(look.far, x, y);
    }
    return finish(canvas);
  }

  for (let x = 0; x < W; x++) {
    let h: number;
    switch (look.shape) {
      case 'cordillera':
        h = 12 + Math.round(wave(x, [6, 13, 27], [5, 3, 1.5]));
        break;
      case 'volcanes': {
        // Three cones per screen with a broad base.
        const p = ((x % 160) + 160) % 160;
        h = 6 + Math.max(0, 20 - Math.abs(p - 80) * 0.45) + Math.round(wave(x, [9], [1]));
        break;
      }
      case 'torres': {
        // Three granite needles (Torres del Paine) every 240 px over a low ridge.
        const p = ((x % 240) + 240) % 240;
        const needles = [
          [92, 24],
          [108, 29],
          [122, 23],
        ] as const;
        let tower = 0;
        for (const [c, top] of needles) tower = Math.max(tower, top - Math.abs(p - c) * 2.6);
        h = Math.max(7 + Math.round(wave(x, [6, 13], [2, 1])), Math.round(tower));
        break;
      }
      case 'hielo':
        h = 8 + Math.round(wave(x, [5, 11], [2, 1])) + ((x % 40) < 18 ? 4 : 0);
        break;
      default:
        h = 9 + Math.round(wave(x, [3, 8, 17], [3, 2, 1]));
    }
    const top = HORIZON_H - h;
    for (let y = top; y < HORIZON_H; y++) {
      const ch = look.cap && y < top + 2 && h > 15 ? look.cap : look.near;
      // Dither the very bottom rows so the strip melts into the floor.
      if (y >= HORIZON_H - 3 && (x + y) % (HORIZON_H - y + 1) !== 0) continue;
      put(ch, x, y);
    }
  }
  return finish(canvas);
}

function finish(canvas: HTMLCanvasElement): Texture {
  const t = Texture.from(canvas);
  t.source.scaleMode = 'nearest';
  t.source.addressMode = 'repeat';
  return t;
}
