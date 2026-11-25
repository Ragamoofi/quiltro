import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import type { Build } from '../game/build.ts';
import { PILARES, PILLAR_POINTS, pillarTier } from '../data/pilares.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { PixelText } from './text.ts';
import { drawChile } from './chileMap.ts';
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
  /** Lucas the trip is worth so far (estimate: km, kills, bosses and cards). */
  lucas: number;
  /** Food picked up this trip. */
  food: number;
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
  private readonly lucasText = new PixelText('0', { color: 'a', outline: 'k' });
  private readonly foodText = new PixelText('0', { color: 'w', outline: 'k' });
  private readonly foodIcon = new Sprite();
  /** Fase 11.9: one line per pillar with points (name, points and a star per bonus). */
  private readonly pillarTexts: PixelText[] = [];
  private pillarKey = '';
  private readonly icons = new Container();
  private readonly iconDots = new Graphics();
  private readonly pause: Button;
  private readonly bossName = new PixelText(' ', { color: 'w', outline: 'k' });
  private readonly map = new Graphics();
  private kmToY: (km: number) => number = () => 0;
  private mapBottom = 0;
  private width = 480;
  private height = 270;
  private buildKey = '';

  constructor(onPause: () => void) {
    const boneTex = anim('hueso', 'icono').textures[0];
    if (boneTex) this.bone.texture = boneTex;
    const killTex = anim('zancudo', 'volar').textures[0];
    if (killTex) this.killIcon.texture = killTex;
    const foodTex = anim('sopaipilla', 'brillo').textures[0];
    if (foodTex) this.foodIcon.texture = foodTex;
    this.pause = new Button('II', 14, 12, onPause, 'K', 'w');
    this.root.addChild(
      this.map,
      this.g,
      this.bone,
      this.levelText,
      this.kmText,
      this.cityText,
      this.timeText,
      this.killText,
      this.killIcon,
      this.lucasText,
      this.foodText,
      this.foodIcon,
      this.icons,
      this.iconDots,
      this.pause,
      this.bossName,
    );
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.buildKey = '';
    this.map.clear();
    const top = 34;
    const height = Math.max(60, Math.min(150, h - 90));
    this.kmToY = drawChile(this.map, w - 11, top, height, 3);
    this.mapBottom = top + height;
  }

  render(
    s: HudState,
    build: Build,
    stick: { ox: number; oy: number; x: number; y: number } | null,
    boss: { name: string; ratio: number; intro: number } | null = null,
    pointer: { x: number; y: number; angle: number } | null = null,
    extra: { km: number; antartica: boolean; touch: boolean; holding: boolean } | null = null,
  ): void {
    const g = this.g;
    g.clear();
    const w = this.width;
    if (extra) {
      // Mini map of Chile on the right edge with the dog's dot travelling south.
      const y = extra.antartica ? this.mapBottom + 4 : this.kmToY(extra.km);
      const x = w - 10;
      g.rect(x - 2, y - 1, 4, 3).fill(C('k'));
      g.rect(x - 1, y, 2, 1).fill(C(Math.floor(s.seconds * 3) % 2 === 0 ? 'W' : 'c'));
      // Touch: the big "dar hilo" button on the right half.
      if (extra.touch) {
        const bx = w - 46;
        const by = this.height - 44;
        g.circle(bx, by, 18).fill(C(extra.holding ? 'b' : 'K')).stroke({ width: 2, color: C('k') });
        g.circle(bx, by, 18).stroke({ width: 1, color: C(extra.holding ? 's' : 'g') });
      }
    }
    if (pointer) {
      // Small gold arrow at the screen edge.
      const { x, y, angle } = pointer;
      const tip = { x: x + Math.cos(angle) * 6, y: y + Math.sin(angle) * 6 };
      const l = { x: x + Math.cos(angle + 2.5) * 5, y: y + Math.sin(angle + 2.5) * 5 };
      const r = { x: x + Math.cos(angle - 2.5) * 5, y: y + Math.sin(angle - 2.5) * 5 };
      g.poly([Math.round(tip.x), Math.round(tip.y), Math.round(l.x), Math.round(l.y), Math.round(r.x), Math.round(r.y)])
        .fill(C('a'))
        .stroke({ width: 1, color: C('k') });
    }

    // Boss bar along the bottom; it fills up during the 2 s intro.
    this.bossName.visible = !!boss;
    if (boss) {
      const bw = Math.min(260, w - 60);
      const bx = Math.round((w - bw) / 2);
      const by = this.height - 12;
      const shown = boss.intro > 0 ? Math.min(boss.ratio, 1 - boss.intro / 2) : boss.ratio;
      g.rect(bx - 1, by - 1, bw + 2, 7).fill(C('k'));
      g.rect(bx, by, bw, 5).fill(C('R'));
      g.rect(bx, by, Math.round(bw * Math.max(0, shown)), 5).fill(C('r'));
      g.rect(bx, by, Math.round(bw * Math.max(0, shown)), 1).fill(C('p'));
      this.bossName.text = boss.name;
      this.bossName.position.set(Math.round((w - this.bossName.width) / 2), by - this.bossName.height - 1);
    }

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
    // Lucas of the trip: a gold coin with a dark stripe and the running total.
    this.lucasText.text = formatNumber(s.lucas);
    this.lucasText.position.set(w - 20 - this.lucasText.width, 29);
    const cx = w - 26 - this.lucasText.width;
    g.circle(cx, 32, 4).fill(C('a')).stroke({ width: 1, color: C('k') });
    g.rect(cx - 2, 30, 1, 3).fill(C('y'));
    // Food picked up this trip, under the health bar.
    this.foodText.text = formatNumber(s.food);
    this.foodText.position.set(15, 27);
    this.foodIcon.position.set(3, 25);
    this.renderPillars(build);

    this.renderBuild(build);

    if (stick) {
      g.circle(Math.round(stick.ox), Math.round(stick.oy), 16).stroke({ width: 1, color: C('w') });
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).fill(C('w'));
      g.circle(Math.round(stick.x), Math.round(stick.y), 6).stroke({ width: 1, color: C('k') });
    }
  }

  /** Under the food: the pillars that have points, in their colour, with a star for each bonus reached. */
  private renderPillars(build: Build): void {
    const rows = PILARES.map((pl) => ({ pl, pts: build.pillarPoints(pl.id) })).filter((r) => r.pts > 0);
    const key = rows.map((r) => `${r.pl.id}${r.pts}`).join();
    if (key === this.pillarKey) return;
    this.pillarKey = key;
    for (const tx of this.pillarTexts) tx.destroy();
    this.pillarTexts.length = 0;
    rows.forEach((r, i) => {
      const tier = pillarTier(r.pts);
      const tx = new PixelText(`${t(`${r.pl.i18n}.nombre`)} ${r.pts}/${PILLAR_POINTS[1]}${'*'.repeat(tier)}`, { color: tier > 0 ? r.pl.color : 'G', outline: 'k' });
      tx.position.set(3, 38 + i * 9);
      this.root.addChild(tx);
      this.pillarTexts.push(tx);
    });
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
