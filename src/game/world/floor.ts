import { Container, Sprite } from 'pixi.js';
import { anim, type Anim } from '../../art/assets.ts';
import { hash2 } from '../../core/rng.ts';

export const TILE = 16;

/**
 * Infinite tiled floor. Keeps just enough sprites to cover the view plus one
 * tile, and re-textures them when the camera crosses a tile boundary. The
 * variant of each world tile is a pure function of its coordinates.
 */
export class FloorLayer {
  readonly root = new Container();
  private readonly tiles: Sprite[] = [];
  private cols = 0;
  private rows = 0;
  private lastTx = Number.NaN;
  private lastTy = Number.NaN;
  private variants: Anim;
  private cumulative: number[] = [];

  private readonly seed: number;

  constructor(floorSprite: string, weights: readonly number[], seed = 0) {
    this.seed = seed;
    this.variants = anim(floorSprite, 'variantes');
    this.setFloor(floorSprite, weights);
  }

  /** Switches to another zone's tiles (redrawn on the next update). */
  setFloor(floorSprite: string, weights: readonly number[]): void {
    this.variants = anim(floorSprite, 'variantes');
    let acc = 0;
    this.cumulative = weights.map((w) => (acc += w));
    this.lastTx = Number.NaN;
  }

  resize(viewW: number, viewH: number): void {
    this.cols = Math.ceil(viewW / TILE) + 1;
    this.rows = Math.ceil(viewH / TILE) + 1;
    const need = this.cols * this.rows;
    while (this.tiles.length < need) {
      const s = new Sprite();
      s.anchor.set(0, 0);
      this.tiles.push(s);
      this.root.addChild(s);
    }
    for (let i = 0; i < this.tiles.length; i++) {
      const s = this.tiles[i];
      if (s) s.visible = i < need;
    }
    this.lastTx = Number.NaN;
  }

  /** originX/Y: whole-pixel world coordinate of the screen's top-left corner. */
  update(originX: number, originY: number): void {
    const tx = Math.floor(originX / TILE);
    const ty = Math.floor(originY / TILE);
    this.root.position.set(tx * TILE - originX, ty * TILE - originY);
    if (tx === this.lastTx && ty === this.lastTy) return;
    this.lastTx = tx;
    this.lastTy = ty;
    const total = this.cumulative[this.cumulative.length - 1] ?? 1;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const s = this.tiles[r * this.cols + c];
        if (!s) continue;
        const h = hash2(tx + c, ty + r, this.seed) * total;
        let v = this.cumulative.findIndex((cum) => h < cum);
        if (v < 0) v = 0;
        const tex = this.variants.textures[v];
        if (tex) s.texture = tex;
        s.position.set(c * TILE, r * TILE);
      }
    }
  }
}
