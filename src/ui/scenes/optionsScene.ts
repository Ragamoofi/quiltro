import { Container, Graphics } from 'pixi.js';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import type { Settings } from '../../meta/save.ts';
import { OptionsView, type OptionsHooks } from '../optionsView.ts';
import { C } from '../widgets.ts';

/** Opciones as a full screen (from the main menu). */
export class OptionsScene implements Scene {
  readonly root = new Container();
  private readonly view: OptionsView;
  private w = 480;
  private h = 270;

  constructor(input: Input, settings: Settings, hooks: OptionsHooks) {
    this.view = new OptionsView(settings, hooks);
    this.root.addChild(new Graphics(), this.view.root);
    input.onPress('Escape', () => hooks.close());
  }

  enter(): void {}
  exit(): void {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    const bg = this.root.getChildAt(0) as Graphics;
    bg.clear().rect(0, 0, w, h).fill(C('K'));
    this.view.show(this.w, this.h);
  }

  update(): void {}
  render(): void {}
}
