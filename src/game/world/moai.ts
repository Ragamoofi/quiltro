import { Sprite } from 'pixi.js';
import { anim, frameAt } from '../../art/assets.ts';

/** A friendly moai whose eyes glow (Guardianes). */
export class AnimatedMoai {
  readonly sprite: Sprite;
  private t = 0;
  private readonly a = anim('moai', 'saludo');

  constructor(x: number, y: number) {
    this.sprite = new Sprite(this.a.textures[0]);
    this.sprite.anchor.set(0.5, 1);
    this.sprite.position.set(Math.round(x), Math.round(y));
    this.sprite.zIndex = y;
  }

  update(dt: number): void {
    this.t += dt;
    const tex = this.a.textures[frameAt(this.a, this.t)];
    if (tex) this.sprite.texture = tex;
  }
}
