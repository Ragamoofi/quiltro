import type { Container } from 'pixi.js';

/** A screen of the game (boot, menu, run, cucha...). Owns one Pixi container. */
export interface Scene {
  readonly root: Container;
  enter(): void;
  exit(): void;
  /** Fixed-step update in game seconds. */
  update(dt: number): void;
  /** alpha: interpolation between the last two updates (0..1). */
  render(alpha: number): void;
  /** Native resolution changed (rotation / resize). */
  resize(width: number, height: number): void;
}

export class SceneManager {
  private current: Scene | null = null;

  private readonly stage: Container;

  constructor(stage: Container) {
    this.stage = stage;
  }

  get active(): Scene | null {
    return this.current;
  }

  change(next: Scene, width: number, height: number): void {
    if (this.current) {
      this.current.exit();
      this.stage.removeChild(this.current.root);
      this.current.root.destroy({ children: true });
    }
    this.current = next;
    this.stage.addChild(next.root);
    next.resize(width, height);
    next.enter();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(alpha: number): void {
    this.current?.render(alpha);
  }

  resize(width: number, height: number): void {
    this.current?.resize(width, height);
  }
}
