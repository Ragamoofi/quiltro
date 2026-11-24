/**
 * Screen shake with a "trauma" model: events add trauma (0..1), it decays over
 * time, and the offset is trauma² × max, always in whole native pixels.
 */
export class Shake {
  trauma = 0;
  /** Options slider (0..1). */
  amount = 1;
  maxOffset = 6;
  decayPerSecond = 1.6;
  x = 0;
  y = 0;
  private t = 0;

  add(trauma: number): void {
    this.trauma = Math.min(1, this.trauma + trauma);
  }

  update(dt: number): void {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - this.decayPerSecond * dt);
    const s = this.trauma * this.trauma * this.maxOffset * this.amount;
    // Two incommensurate sines read as noise but never jump wildly.
    this.x = Math.round(s * Math.sin(this.t * 71.3) * Math.cos(this.t * 13.1));
    this.y = Math.round(s * Math.sin(this.t * 53.7 + 1.3) * Math.cos(this.t * 17.9));
  }
}
