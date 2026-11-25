import { Container, Sprite } from 'pixi.js';
import { anim } from '../../art/assets.ts';
import type { RunContext } from '../context.ts';

interface Cloud {
  x: number;
  y: number;
  life: number;
  tick: number;
  sprite: Sprite;
}

const RADIUS = 14;
const DAMAGE = 4;
const TICK = 0.5;

/** The chingue's toxic cloud: lingers 3 s and hurts the dog every half second. */
export class Clouds {
  readonly root = new Container();
  private list: Cloud[] = [];

  add(x: number, y: number, seconds: number): void {
    const sprite = new Sprite(anim('nube', 'flotar').textures[0]);
    sprite.anchor.set(0.5);
    sprite.scale.set(2);
    this.root.addChild(sprite);
    this.list.push({ x, y, life: seconds, tick: 0, sprite });
  }

  update(dt: number, ctx: RunContext): void {
    const p = ctx.player;
    for (const c of this.list) {
      c.life -= dt;
      c.tick -= dt;
      if (!p.hazardProof && c.tick <= 0 && (p.x - c.x) ** 2 + (p.y - c.y) ** 2 < RADIUS ** 2) {
        c.tick = TICK;
        p.takeDamage(DAMAGE, c.x, c.y, ctx, 'chingue');
      }
    }
    for (const c of this.list.filter((it) => it.life <= 0)) c.sprite.destroy();
    this.list = this.list.filter((c) => c.life > 0);
  }

  render(time: number): void {
    for (const c of this.list) {
      c.sprite.position.set(Math.round(c.x + Math.sin(time * 2 + c.x) * 2), Math.round(c.y));
      c.sprite.visible = c.life > 0.5 || Math.floor(c.life * 16) % 2 === 0;
    }
  }
}
