import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Sfx } from '../../audio/sfx.ts';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import { PERSONAJES, type CharacterDef } from '../../data/personajes.ts';
import { CIUDADES } from '../../data/zonas.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { SaveData } from '../../meta/save.ts';
import { dailyNumber, dailyToday } from '../../meta/daily.ts';
import { achievementsView } from '../achievementsView.ts';
import { chilePanorama, drawFlag, panoramaLayout } from '../chilePanorama.ts';
import { logoSprite } from '../logo.ts';
import { PixelText } from '../text.ts';
import { Button, C, FocusList } from '../widgets.ts';

export interface MenuHooks {
  resume?: () => void;
  hasCheckpoint?: boolean;
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
  /** Fase 11.10: the whole of Chile as a postcard behind the menu. */
  private lobbyArt?: Texture;
  private readonly backdrop = new Sprite();
  private readonly flag = new Graphics();
  private logo: Sprite | null = null;
  private logoY = 0;
  private flagAt = { x: 0, y: 0 };
  private kites: { sprite: Sprite; anim: Anim; x: number; y: number; phase: number }[] = [];
  private readonly strings = new Graphics();
  private anchorAt = { x: 0, y: 0 };
  private readonly layer = new Container();
  private readonly overlay = new Container();
  private readonly focus = new FocusList();
  private readonly cables = new Graphics();
  private dog: { sprite: Sprite; sleep: Anim; stretch: Anim; idle: Anim } | null = null;
  private awakeAt = -1;
  private walkers: Walker[] = [];
  private time = 0;
  private w = 480;
  private h = 270;

  constructor(input: Input, sfx: Sfx, data: SaveData, hooks: MenuHooks) {
    this.data = data;
    this.hooks = hooks;
    this.sfx = sfx;
    this.root.addChild(this.backdrop, this.layer, this.overlay);
    void Assets.load<Texture>('./assets/lobby.png').then(texture => {
      if (this.root.destroyed) return;
      this.lobbyArt = texture;
      this.resize(this.w, this.h);
    }).catch(() => { /* Keep the built-in panorama if the image is unavailable. */ });
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
    if (this.backdrop.texture !== Texture.EMPTY && this.backdrop.texture !== this.lobbyArt) this.backdrop.texture.destroy(true);
    this.backdrop.texture = this.lobbyArt ?? chilePanorama(width, height);
    const scale = Math.max(width / this.backdrop.texture.width, height / this.backdrop.texture.height);
    this.backdrop.scale.set(scale);
    this.backdrop.position.set(width - this.backdrop.width, (height - this.backdrop.height) / 2);
    this.build();
  }

  private build(): void {
    this.layer.removeChildren().forEach((c) => c !== this.cables && c !== this.flag && c !== this.strings && c.destroy({ children: true }));
    const { w, h } = this;
    const portrait = h > w;
    // A big logo that breathes, with the tagline under it.
    const logo = logoSprite(portrait ? 3 : w >= 560 ? 5 : 4);
    this.logoY = portrait ? 22 : 16;
    logo.position.set(Math.round((w - logo.width) / 2), this.logoY);
    this.logo = logo;
    const tagline = new PixelText(t('menu.lema'), { color: 'W', outline: 'k' });
    tagline.position.set(Math.round((w - tagline.width) / 2), this.logoY + logo.height + 3);
    const lucas = new PixelText(t('meta.lucas', { n: formatNumber(this.data.lucas) }), { color: 'a', outline: 'k' });
    lucas.position.set(4, 4);
    const city = CIUDADES.find((c) => c.id === this.data.best.city);
    const rec = new PixelText(
      this.data.best.km > 0 ? t('meta.record', { km: formatNumber(this.data.best.km), lugar: city ? t(city.i18n) : '' }) : t('menu.sinRecord'),
      { color: 'w', outline: 'k' },
    );
    rec.position.set(w - rec.width - 4, 4);
    this.layer.addChild(this.strings, this.flag, logo, tagline, lucas, rec);

    // The meadow: the Cucha, the flag of Chile and kites in the sky (it is always Dieciocho here).
    const groundY = panoramaLayout(w, h).groundY;
    const cx = portrait ? Math.round(w / 2) : Math.round(w * 0.3);
    const cy = portrait ? groundY + 26 : Math.round(groundY + (h - groundY) * 0.62);
    const house = new Sprite(anim('cucha', 'quieto').textures[0]);
    house.anchor.set(0.5, 1);
    house.position.set(cx, cy);
    this.layer.addChild(house);
    this.flagAt = { x: cx - 46, y: cy };
    this.anchorAt = { x: cx + 40, y: cy - 6 };
    this.kites = [
      { x: w * 0.36, y: h * 0.28, v: 'v0', phase: 0 },
      { x: w * 0.44, y: h * 0.46, v: 'v2', phase: 1.7 },
      { x: w * 0.22, y: h * 0.4, v: 'v1', phase: 3.1 },
    ].map((k) => {
      const a = anim('volantin', k.v);
      const sp = new Sprite(a.textures[0]);
      sp.anchor.set(0.5);
      sp.scale.set(2);
      this.layer.addChild(sp);
      return { sprite: sp, anim: a, x: k.x, y: k.y, phase: k.phase };
    });

    const ch = this.character();
    const suffix = ch.id === 'quiltro' && this.data.bandana !== 'b' ? `@${this.data.bandana}` : '';
    const sleep = anim(ch.sprite, `dormir${suffix}`);
    const stretch = anim(ch.sprite, `estirar${suffix}`);
    const idle = anim(ch.sprite, `quieto${suffix}`);
    const dog = new Sprite(sleep.textures[0]);
    dog.anchor.copyFrom(dog.texture.defaultAnchor ?? { x: 0.5, y: 1 });
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

    if (this.lobbyArt) {
      for (const child of this.layer.children) child.visible = child === logo || child === tagline || child === lucas || child === rec;
      if (!portrait) {
        logo.x = Math.round(w * 0.05);
        tagline.x = logo.x;
      }
    }
    // Sticker buttons.
    const bx = portrait ? 20 : Math.round(w * (this.lobbyArt ? 0.05 : 0.6));
    const bw = portrait ? w - 40 : Math.round(w * 0.34);
    let by = portrait ? Math.round(h * 0.6) : Math.max(this.logoY + 60, Math.round(h * 0.3));
    const buttons: Button[] = [];
    const add = (label: string, fn: () => void, fill: string, text: string, height = 20, enabled = true): void => {
      const b = new Button(label, bw, height, fn, fill, text);
      b.setEnabled(enabled);
      b.position.set(bx, by);
      by += height + 6;
      this.layer.addChild(b);
      buttons.push(b);
    };
    if (this.hooks.hasCheckpoint) {
      by = Math.min(by, h - 158);
      add('Continuar zona', () => this.hooks.resume?.(), 'a', 'k', 24);
    }
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
    add('Metas y registros', () => this.showAchievements(), 'K', 'w');
    add(t('ui.opciones'), () => this.hooks.options(), 'K', 'w');
    this.focus.set(buttons);
  }

  private wake(): void {
    if (this.awakeAt >= 0) return;
    this.awakeAt = this.time;
    const v = this.character().voice;
    this.sfx.play(v?.sound ?? 'guau', { pitch: (v?.pitch ?? 1) * 1.1, gain: 0.5 });
    this.build();
  }

  private showAchievements(): void {
    this.closeOverlay();
    this.overlay.addChild(achievementsView(this.data, this.w, this.h, () => this.closeOverlay()));
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
    if (this.logo) this.logo.y = this.logoY + Math.round(Math.sin(this.time * 1.6) * 1.5);
    this.flag.clear();
    drawFlag(this.flag, this.flagAt.x, this.flagAt.y, this.time, this.h > 300 ? 1.3 : 1);
    this.strings.clear();
    for (const k of this.kites) {
      const kx = Math.round(k.x + Math.sin(this.time * 0.9 + k.phase) * 6);
      const ky = Math.round(k.y + Math.sin(this.time * 1.3 + k.phase) * 4);
      k.sprite.position.set(kx, ky);
      k.sprite.rotation = Math.sin(this.time * 1.1 + k.phase) * 0.15;
      const tex = k.anim.textures[frameAt(k.anim, this.time + k.phase)];
      if (tex) k.sprite.texture = tex;
      // The line sags down to the dog.
      const mx = (kx + this.anchorAt.x) / 2;
      const my = Math.max(ky, this.anchorAt.y) - 6;
      this.strings.moveTo(kx + 0.5, ky + 6.5).quadraticCurveTo(mx, my, this.anchorAt.x + 0.5, this.anchorAt.y + 0.5).stroke({ width: 1, color: C('W'), alpha: 0.8 });
    }
    if (this.dog) {
      const since = this.awakeAt >= 0 ? this.time - this.awakeAt : -1;
      const a = since < 0 ? this.dog.sleep : since < 1 ? this.dog.stretch : this.dog.idle;
      const tex = a.textures[frameAt(a, since < 0 ? this.time : since)];
      if (tex) this.dog.sprite.texture = tex;
    }
    const groundY = this.h - 10;
    for (const p of this.walkers) {
      const tex = p.anim.textures[frameAt(p.anim, p.t * 0.6)];
      if (tex) p.sprite.texture = tex;
      p.sprite.scale.x = p.dir;
      p.sprite.position.set(Math.round(p.x), groundY + Math.round(Math.abs(Math.sin(p.t * 4)) * -2));
    }
  }
}
