/**
 * Camera that follows a target with smoothing and a small look-ahead toward the
 * movement direction. Its final position is rounded to whole native pixels so the
 * world never shimmers (GDD "Resolución y cámara").
 */
export class Camera {
  /** Smoothed world position of the screen centre. */
  x = 0;
  y = 0;
  /** Previous update's position, for render interpolation. */
  prevX = 0;
  prevY = 0;

  /** Seconds to close ~63 % of the gap. Lower = snappier. */
  smoothing = 0.12;
  /** How far ahead (px) the camera looks at full speed. */
  lookAhead = 24;

  private aheadX = 0;
  private aheadY = 0;

  snapTo(x: number, y: number): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
  }

  /** dirX/dirY: the target's movement direction scaled 0..1 by speed. */
  update(dt: number, targetX: number, targetY: number, dirX: number, dirY: number): void {
    this.prevX = this.x;
    this.prevY = this.y;
    const aheadK = 1 - Math.exp(-dt / 0.35);
    this.aheadX += (dirX * this.lookAhead - this.aheadX) * aheadK;
    this.aheadY += (dirY * this.lookAhead - this.aheadY) * aheadK;
    const k = 1 - Math.exp(-dt / this.smoothing);
    this.x += (targetX + this.aheadX - this.x) * k;
    this.y += (targetY + this.aheadY - this.y) * k;
  }

  /** Interpolated top-left corner in whole pixels for a view of the given size. */
  viewOrigin(alpha: number, viewW: number, viewH: number): { x: number; y: number } {
    const cx = this.prevX + (this.x - this.prevX) * alpha;
    const cy = this.prevY + (this.y - this.prevY) * alpha;
    return { x: Math.round(cx - viewW / 2), y: Math.round(cy - viewH / 2) };
  }
}
