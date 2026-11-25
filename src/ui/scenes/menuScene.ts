import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { SUELO_CENTRO_PESOS } from '../../art/sprites/suelos.ts';
import type { Sfx } from '../../audio/sfx.ts';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import { PERSONAJES, type CharacterDef } from '../../data/personajes.ts';
import { CIUDADES } from '../../data/zonas.ts';
import { FloorLayer } from '../../game/world/floor.ts';
import { Horizon, HORIZON_H } from '../../game/world/horizon.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { SaveData } from '../../meta/save.ts';
import { dailyNumber, dailyToday } from '../../meta/daily.ts';
import { achievementsView } from '../achievementsView.ts';
import { logoSprite } from '../logo.ts';
import { PixelText } from '../text.ts';
import { Button, C, FocusList } from '../widgets.ts';

export interface MenuHooks {
  travel(): void;
  daily(): void;
  cucha(): void;
  options(): void;
}

interface Walker {
  sprite: Sprite;
  anim: Anim;
  x: number;
  dir: number;
  t: number;
}

/**
 * Menú principal: the quiltro asleep in front of its Cucha on a lively
 * street (pigeons, a kite tangled in the wires). Touch it and it wakes up and
 * stretches. Big sticker buttons: ¡Viajar!, Ruta del día, La Cucha, Logros,
 * Opciones; lucas and the km record on top.
 */
export class MenuScene implements Scene {
  readonly root = new Container();
  private readonly data: SaveData;
  private readonly hooks: MenuHooks;
  private readonly sfx: Sfx;
  private readonly floor = new FloorLayer('suelo_centro', SUELO_CENTRO_PESOS, 11);
  private readonly horizon = new Horizon();
  private readonly layer = new Container();
  private readonly overlay = new Container();
  private readonly focus = new FocusList();
  private readonly cables = new Graphics();
  private dog: { sprite: Sprite; sleep: Anim; stretch: Anim; idle: Anim } | null = null;
  private awakeAt = -1;
  private walkers: Walker[] = [];
  private kite: { sprite: Sprite; anim: Anim } | null = null;
  private time = 0;
  private w = 480;
  private h = 270;

  constructor(input: Input, sfx: Sfx, data: SaveData, hooks: MenuHooks) {
    this.data = data;
    this.hooks = hooks;
    this.sfx = sfx;
    this.root.addChild(this.floor.root, this.horizon.root, this.layer, this.overlay);
    for (const code of ['ArrowUp', 'ArrowLeft']) input.onPress(code, () => this.focus.move(-1));
    for (const code of ['ArrowDown', 'ArrowRight']) input.onPress(code, () => this.focus.move(1));
    input.onPress('Enter', () => (this.overlay.children.length ? this.closeOverlay() : this.focus.press()));
    input.onPress('GamepadA', () => (this.overlay.children.length ? this.closeOverlay() : this.focus.press()));
    input.onPress('Escape', () => this.closeOverlay());
  }

  enter(): void {}
  exit(): void {}

  private character(): CharacterDef {
    return PERSONAJES.find((p) => p.id === this.data.character && this.data.characters.includes(p.id)) ?? (PERSONAJES[0] as CharacterDef);
  }

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.floor.resize(width, height);
    this.horizon.setZone('centro', width);
    this.build();
  }

  private build(): void {
    this.layer.removeChildren().forEach((c) => c !== this.cables && c.destroy({ children: true }));
    const { w, h } = this;
    const portrait = h > w;
    const logo = logoSprite(portrait ? 2 : 3);
    logo.position.set(Math.round((w - logo.width) / 2), HORIZON_H + 4);
    const lucas = new PixelText(t('meta.lucas', { n: formatNumber(this.data.lucas) }), { color: 'a', outline: 'k' });
    lucas.position.set(4, 4);
    const city = CIUDADES.find((c) => c.id === this.data.best.city);
    const rec = new PixelText(
      this.data.best.km > 0 ? t('meta.record', { km: formatNumber(this.data.best.km), lugar: city ? t(city.i18n) : '' }) : t('menu.sinRecord'),
      { color: 'w', outline: 'k' },
    );
    rec.position.set(w - rec.width - 4, 4);
    this.layer.addChild(this.cables, logo, lucas, rec);

    // The street scene: house, sleeping dog, pole with the tangled kite.
    const cx = portrait ? Math.round(w / 2) : Math.round(w * 0.3);
    const cy = portrait ? Math.round(h * 0.52) : Math.round(h * 0.78);
    const house = new Sprite(anim('cucha', 'quieto').textures[0]);
    house.anchor.set(0.5, 1);
    house.position.set(cx, cy);
    const poleX = cx + 70;
    const pole = new Sprite(anim('poste', 'quieto').textures[0]);
    pole.anchor.set(0.5, 1);
    pole.position.set(poleX, cy - 6);
    this.layer.addChild(house, pole);
    this.cables.clear();
    for (let i = 0; i < 3; i++) {
      this.cables.moveTo(poleX - 6 + i * 6 + 0.5, cy - 44 + 0.5).lineTo(poleX - 120 + 0.5, cy - 54 + i * 4 + 0.5).stroke({ width: 1, color: C(i === 1 ? 'K' : 'k') });
      this.cables.moveTo(poleX - 6 + i * 6 + 0.5, cy - 44 + 0.5).lineTo(w + 0.5, cy - 64 + i * 5 + 0.5).stroke({ width: 1, color: C(i === 1 ? 'K' : 'k') });
    }
    const kiteAnim = anim('volantin', 'v1');
    const kite = new Sprite(kiteAnim.textures[0]);
    kite.anchor.set(0.5);
    kite.position.set(poleX + 30, cy - 52);
    this.layer.addChild(kite);
    this.kite = { sprite: kite, anim: kiteAnim };

    const ch = this.character();
    const suffix = ch.id === 'quiltro' && this.data.bandana !== 'b' ? `@${this.data.bandana}` : '';
    const sleep = anim(ch.sprite, `dormir${suffix}`);
    const stretch = anim(ch.sprite, `estirar${suffix}`);
    const idle = anim(ch.sprite, `quieto${suffix}`);
    const dog = new Sprite(sleep.textures[0]);
    dog.anchor.set(0.5, 22 / 24);
    dog.scale.set(2);
    dog.position.set(cx + 40, cy + 6);
    dog.eventMode = 'static';
    dog.cursor = 'pointer';
    dog.on('pointertap', () => this.wake());
    this.layer.addChild(dog);
    this.dog = { sprite: dog, sleep, stretch, idle };
    if (this.awakeAt < 0) {
      const hint = new PixelText(t('menu.tocaParaDespertar'), { color: 'G', outline: 'k' });
      hint.position.set(Math.round(cx + 40 - hint.width / 2), cy + 12);
      this.layer.addChild(hint);
    }

    // Pigeons strolling on the sidewalk.
    this.walkers = [0, 1, 2].map((i) => {
      const a = anim('paloma', 'volar');
      const s = new Sprite(a.textures[0]);
      s.anchor.set(0.5);
      this.layer.addChild(s);
      return { sprite: s, anim: a, x: 40 + i * 90, dir: i % 2 === 0 ? 1 : -1, t: i };
    });

    // Sticker buttons.
    const bx = portrait ? 20 : Math.round(w * 0.6);
    const bw = portrait ? w - 40 : Math.round(w * 0.34);
    let by = portrait ? Math.round(h * 0.6) : HORIZON_H + 56;
    const buttons: Button[] = [];
    const add = (label: string, fn: () => void, fill: string, text: string, height = 20, enabled = true): void => {
      const b = new Button(label, bw, height, fn, fill, text);
      b.setEnabled(enabled);
      b.position.set(bx, by);
      by += height + 6;
      this.layer.addChild(b);
      buttons.push(b);
    };
    add(t('ui.viajar'), () => this.hooks.travel(), 'a', 'k', 28);
    // Ruta del día: today's number; once the counted attempt is used it shows the km and repeats as practice.
    const today = dailyToday(this.data);
    const number = dailyNumber(today.key);
    add(
      today.counted ? t('compartir.rutaHecha', { n: number, km: formatNumber(today.km) }) : t('compartir.rutaHoy', { n: number }),
      () => this.hooks.daily(),
      'b',
      'w',
    );
    add(t('ui.cucha'), () => this.hooks.cucha(), 'v', 'w');
    add(t('ui.logros'), () => this.showAchievements(), 'K', 'w');
    add(t('ui.opciones'), () => this.hooks.options(), 'K', 'w');
    this.focus.set(buttons);
  }

  private wake(): void {
    if (this.awakeAt >= 0) return;
    this.awakeAt = this.time;
    this.sfx.play('guau', { pitch: 1.3, gain: 0.5 });
    this.build();
  }

  private showAchievements(): void {
    this.closeOverlay();
    this.overlay.addChild(achievementsView(this.data.achievements, this.w, this.h, () => this.closeOverlay()));
  }

  private closeOverlay(): void {
    this.overlay.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  update(dt: number): void {
    this.time += dt;
    for (const p of this.walkers) {
      p.t += dt;
      p.x += p.dir * 14 * dt;
      if (p.x < -20 || p.x > this.w + 20) p.dir *= -1;
    }
  }

  render(): void {
    this.floor.update(0, 0);
    this.horizon.update(this.time * 6, this.time);
    if (this.dog) {
      const since = this.awakeAt >= 0 ? this.time - this.awakeAt : -1;
      const a = since < 0 ? this.dog.sleep : since < 1 ? this.dog.stretch : this.dog.idle;
      const tex = a.textures[frameAt(a, since < 0 ? this.time : since)];
      if (tex) this.dog.sprite.texture = tex;
    }
    if (this.kite) {
      const tex = this.kite.anim.textures[frameAt(this.kite.anim, this.time)];
      if (tex) this.kite.sprite.texture = tex;
    }
    const groundY = this.h > this.w ? Math.round(this.h * 0.57) : this.h - 10;
    for (const p of this.walkers) {
      const tex = p.anim.textures[frameAt(p.anim, p.t * 0.6)];
      if (tex) p.sprite.texture = tex;
      p.sprite.scale.x = p.dir;
      p.sprite.position.set(Math.round(p.x), groundY + Math.round(Math.abs(Math.sin(p.t * 4)) * -2));
    }
  }
}
