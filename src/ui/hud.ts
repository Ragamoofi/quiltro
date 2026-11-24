import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import type { Build } from '../game/build.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { Button, C } from './widgets.ts';

export interface HudState {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNext: number;
  km: number;
  city: string;
  seconds: number;
  kills: number;
}

/**
 * HUD (GDD "HUD"): thin gold XP bar across the top with the level, health bar
 * with the bone, km and city in the centre, time + kills + pause on the
 * right, weapon and trait icons bottom-left with level dots, and the floating
 * joystick on touch screens. Takes at most ~12 % of the screen.
 */
export class Hud {
  readonly root = new Container();
  private readonly g = new Graphics();
  private readonly bone = new Sprite();
  private readonly levelText = new PixelText('NV 1', { color: 'w', outline: 'k' });
  private readonly kmText = new PixelText('0 KM', { color: 'w', outline: 'k' }, 2);
  private readonly cityText = new PixelText('', { color: 'a', outline: 'k' });
  private readonly timeText = new PixelText('0:00', { color: 'w', outline: 'k' });
  private readonly killText = new PixelText('0', { color: 'w', outline: 'k' });
  private readonly killIcon = new Sprite();
  private readonly icons = new Container();
  private readonly iconDots = new Graphics();
  private readonly pause: Button;
  private width = 480;
  private height = 270;
  private buildKey = '';

  constructor(onPause: () => void) {
    const boneTex = anim('hueso', 'icono').textures[0];
    if (boneTex) this.bone.texture = boneTex;
    const killTex = anim('zancudo', 'volar').textures[0];
    if (killTex) this.killIcon.texture = killTex;
    this.pause = new Button('II', 14, 12, onPause, 'K', 'w');
    this.root.addChild(
      this.g,
      this.bone,
      this.levelText,
      this.kmText,
      this.cityText,
      this.timeText,
      this.killText,
      this.killIcon,
      this.icons,
      this.iconDots,
      this.pause,
    );
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.buildKey = '';
  }

  render(s: HudState, build: Build, stick: { ox: number; oy: number; x: number; y: number } | null): void {
    const g = this.g;
    g.clear();
    const w = this.width;

    // XP bar: full width, 3 px gold.
    const fill = Math.round((w - 2) * Math.min(1, s.xp / Math.max(1, s.xpNext)));
    g.rect(0, 0, w, 5).fill(C('k'));
    g.rect(1, 1, w - 2, 3).fill(C('K'));
    if (fill > 0) {
      g.rect(1, 1, fill, 3).fill(C('a'));
      g.rect(1, 1, fill, 1).fill(C('y'));
    }
    this.levelText.text = t('ui.nivelCorto', { n: s.level });
    this.levelText.position.set(2, 7);

    // Health bar under the level.
    const hx = 15;
    const hy = 18;
    const hw = Math.min(70, Math.floor(w * 0.18));
    const hf = Math.max(0, Math.round((hw * s.hp) / s.maxHp));
    this.bone.position.set(3, hy - 1);
    g.rect(hx - 1, hy - 1, hw + 2, 5).fill(C('k'));
    g.rect(hx, hy, hw, 3).fill(C('K'));
    if (hf > 0) {
      g.rect(hx, hy, hf, 3).fill(C('r'));
      g.rect(hx, hy, hf, 1).fill(C('p'));
    }

    // Km and city, centre top.
    this.kmText.text = `${formatNumber(s.km)} KM`;
    this.kmText.position.set(Math.round((w - this.kmText.width) / 2), 7);
    this.cityText.text = s.city;
    this.cityText.position.set(Math.round((w - this.cityText.width) / 2), 7 + this.kmText.height + 1);

    // Time, kills and pause, top right.
    this.pause.position.set(w - 17, 7);
    this.timeText.text = `${Math.floor(s.seconds / 60)}:${String(Math.floor(s.seconds % 60)).padStart(2, '0')}`;
    this.timeText.position.set(w - 20 - this.timeText.width, 9);
    this.killText.text = formatNumber(s.kills);
    this.killText.position.set(w - 20 - this.killText.width, 19);
    this.killIcon.position.set(w - 34 - this.killText.width, 16);

    this.renderBuild(build);

    if (stick) {
      g.circle(Math.round(stick.ox), Math.round(stick.oy), 16).stroke({ width: 1, color: C('w') });
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).fill(C('w'));
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).stroke({ width: 1, color: C('k') });
    }
  }

  /** Bottom-left: weapons then traits, each with level dots. Rebuilt only on change. */
  private renderBuild(build: Build): void {
    const items = [
      ...build.weapons.map((wp) => ({ id: wp.def.id, level: wp.level, max: wp.def.maxLevel })),
      ...build.traits.map((tr) => ({ id: tr.def.id, level: tr.level, max: tr.def.maxLevel })),
    ];
    const key = items.map((i) => `${i.id}${i.level}`).join();
    if (key === this.buildKey) return;
    this.buildKey = key;
    this.icons.removeChildren().forEach((c) => c.destroy());
    const d = this.iconDots;
    d.clear();
    const y = this.height - 22;
    items.forEach((it, i) => {
      const x = 3 + i * 18;
      const s = new Sprite(anim('icono', it.id).textures[0]);
      s.position.set(x, y);
      this.icons.addChild(s);
      for (let k = 0; k < it.max; k++) d.rect(x + 1 + k * 3, y + 17, 2, 2).fill(C(k < it.level ? 'a' : 'K'));
    });
  }
}
