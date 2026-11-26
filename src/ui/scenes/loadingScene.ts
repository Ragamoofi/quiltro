import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Scene } from '../../core/scene.ts';
import { tList } from '../../i18n/index.ts';
import { logoSprite } from '../logo.ts';
import { PixelText } from '../text.ts';
import { C } from '../widgets.ts';

const DURATION = 1.2;

/**
 * Carga (< 2 s): the logo with the quiltro wagging its tail, the loading bar
 * as a kite climbing, and a random fact about Chile underneath.
 */
export class LoadingScene implements Scene {
  readonly root = new Container();
  private readonly onDone: () => void;
  private readonly dog: Sprite;
  private readonly dogAnim: Anim;
  private readonly kite: Sprite;
  private readonly kiteAnim: Anim;
  private readonly bar = new Graphics();
  private readonly fact: string;
  private time = 0;
  private w = 480;
  private h = 270;
  private done = false;

  constructor(onDone: () => void, factIndex: number) {
    this.onDone = onDone;
    this.dogAnim = anim('quiltro', 'quieto');
    this.dog = new Sprite(this.dogAnim.textures[0]);
    this.dog.anchor.copyFrom(this.dog.texture.defaultAnchor ?? { x: 0.5, y: 1 });
    this.dog.scale.set(3);
    this.kiteAnim = anim('volantinAzul', 'ondear');
    this.kite = new Sprite(this.kiteAnim.textures[0]);
    this.kite.anchor.set(0.5);
    const facts = tList('datosCarga');
    this.fact = facts[factIndex % Math.max(1, facts.length)] ?? '';
  }

  enter(): void {}
  exit(): void {}

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.root.removeChildren().forEach((c) => c !== this.dog && c !== this.kite && c !== this.bar && c.destroy());
    const bg = new Graphics().rect(0, 0, width, height).fill(C('k'));
    const logo = logoSprite(width < 300 ? 3 : 4);
    logo.position.set(Math.round((width - logo.width) / 2), Math.round(height * 0.16));
    const fact = new PixelText(this.fact, { color: 'G', outline: null, maxWidth: width - 40, align: 'center' });
    fact.position.set(Math.round((width - fact.width) / 2), height - fact.height - 14);
    this.dog.position.set(Math.round(width / 2), Math.round(height * 0.62));
    this.root.addChild(bg, logo, this.dog, this.bar, this.kite, fact);
  }

  update(dt: number): void {
    this.time += dt;
    if (!this.done && this.time >= DURATION) {
      this.done = true;
      this.onDone();
    }
  }

  render(): void {
    const k = Math.min(1, this.time / DURATION);
    const dt = this.dogAnim.textures[frameAt(this.dogAnim, this.time * 2)];
    if (dt) this.dog.texture = dt;
    const kt = this.kiteAnim.textures[frameAt(this.kiteAnim, this.time)];
    if (kt) this.kite.texture = kt;
    // The bar is the line; the kite climbs as it fills.
    const x0 = Math.round(this.w / 2 - 70);
    const y0 = Math.round(this.h * 0.75);
    const g = this.bar;
    g.clear();
    g.rect(x0, y0, 140, 1).fill(C('K'));
    g.rect(x0, y0, Math.round(140 * k), 1).fill(C('w'));
    this.kite.position.set(x0 + Math.round(140 * k), y0 - 6 - Math.round(Math.sin(this.time * 6) * 2));
  }
}
