/**
 * Uniform spatial hash (64 px cells, GDD "Reglas de ingeniería").
 * Rebuilt every update; queries return candidate ids, callers check distance.
 */
export class SpatialGrid {
  readonly cell: number;
  private readonly cells = new Map<number, number[]>();
  private readonly used: number[][] = [];

  constructor(cell = 64) {
    this.cell = cell;
  }

  private key(cx: number, cy: number): number {
    return (cx + 32768) * 65536 + (cy + 32768);
  }

  clear(): void {
    for (const a of this.used) a.length = 0;
    this.used.length = 0;
    if (this.cells.size > 4096) this.cells.clear();
  }

  insert(id: number, x: number, y: number): void {
    const k = this.key(Math.floor(x / this.cell), Math.floor(y / this.cell));
    let a = this.cells.get(k);
    if (!a) {
      a = [];
      this.cells.set(k, a);
    }
    if (a.length === 0) this.used.push(a);
    a.push(id);
  }

  /** Fills `out` with ids in cells touching the circle (x, y, r). */
  query(x: number, y: number, r: number, out: number[]): number[] {
    out.length = 0;
    const x0 = Math.floor((x - r) / this.cell);
    const x1 = Math.floor((x + r) / this.cell);
    const y0 = Math.floor((y - r) / this.cell);
    const y1 = Math.floor((y + r) / this.cell);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const a = this.cells.get(this.key(cx, cy));
        if (a) for (const id of a) out.push(id);
      }
    }
    return out;
  }
}
