/**
 * Fixed-step game loop: 60 updates per second, rendering with an interpolation
 * factor. Slow motion scales game time, never frames (GDD "Reglas de ingeniería").
 */
export const STEP = 1 / 60;
/** Never simulate more than this per real frame (tab switch, breakpoint...). */
export const MAX_FRAME = 0.25;

export interface LoopHooks {
  update(dt: number): void;
  render(alpha: number, realDt: number): void;
}

/** Pure accumulator step, exported for tests. Returns steps to run and the new remainder. */
export function advance(
  accumulator: number,
  realDt: number,
  timeScale: number,
): { steps: number; accumulator: number } {
  let acc = accumulator + Math.min(Math.max(realDt, 0), MAX_FRAME) * timeScale;
  let steps = 0;
  while (acc >= STEP) {
    acc -= STEP;
    steps++;
  }
  return { steps, accumulator: acc };
}

export class GameLoop {
  /** 1 = normal, 0.3 = level-up slow motion, 0 = frozen (hit-stop). */
  timeScale = 1;
  /** Measured render frames per second (smoothed). */
  fps = 0;
  /** Measured updates per second (smoothed). */
  ups = 0;

  private accumulator = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private statTime = 0;
  private statFrames = 0;
  private statUpdates = 0;

  private readonly hooks: LoopHooks;

  constructor(hooks: LoopHooks) {
    this.hooks = hooks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const realDt = (now - this.last) / 1000;
    this.last = now;

    const { steps, accumulator } = advance(this.accumulator, realDt, this.timeScale);
    this.accumulator = accumulator;
    for (let i = 0; i < steps; i++) this.hooks.update(STEP);
    this.hooks.render(this.accumulator / STEP, realDt);

    this.statFrames++;
    this.statUpdates += steps;
    this.statTime += realDt;
    if (this.statTime >= 0.5) {
      this.fps = Math.round(this.statFrames / this.statTime);
      this.ups = Math.round(this.statUpdates / this.statTime);
      this.statFrames = 0;
      this.statUpdates = 0;
      this.statTime = 0;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
