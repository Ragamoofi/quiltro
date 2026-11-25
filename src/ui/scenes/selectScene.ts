import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import type { Sfx } from '../../audio/sfx.ts';
import type { Input } from '../../core/input.ts';
import type { Scene } from '../../core/scene.ts';
import { ARMAS } from '../../data/armas.ts';
import { JEFES } from '../../data/jefes.ts';
import { pasajeAt, pasajesOpen } from '../../data/pasajes.ts';
import { PERSONAJES, PLAYER_BASE, type CharacterDef } from '../../data/personajes.ts';
import { CIUDADES } from '../../data/zonas.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { SaveData } from '../../meta/save.ts';
import { PixelText } from '../text.ts';
import { Button, C, FocusList, panel } from '../widgets.ts';

export interface SelectHooks {
  go(): void;
  back(): void;
  save(): void;
}

/**
 * Elegir personaje: a carousel with the character big and animated, its
 * stats as bars and its starting weapon. Locked ones appear as a silhouette
 * with the condition to unlock them.
 */
export class SelectScene implements Scene {
  readonly root = new Container();
  private readonly data: SaveData;
  private readonly hooks: SelectHooks;
  private readonly sfx: Sfx;
  private readonly focus = new FocusList();
  private index: number;
  private big: { sprite: Sprite; anim: Anim } | null = null;
  private time = 0;
  private w = 480;
  private h = 270;

  constructor(input: Input, sfx: Sfx, data: SaveData, hooks: SelectHooks) {
    this.data = data;
    this.hooks = hooks;
    this.sfx = sfx;
    this.index = Math.max(0, PERSONAJES.findIndex((p) => p.id === data.character));
    input.onPress('ArrowLeft', () => this.cycle(-1));
    input.onPress('ArrowRight', () => this.cycle(1));
    input.onPress('ArrowUp', () => this.focus.move(-1));
    input.onPress('ArrowDown', () => this.focus.move(1));
    input.onPress('Enter', () => this.focus.press());
    input.onPress('GamepadA', () => this.focus.press());
    input.onPress('Escape', () => this.hooks.back());
  }

  enter(): void {}
  exit(): void {}

  resize(width: number, height: number): void {
    this.w = width;
    this.h = height;
    this.build();
  }

  private get char(): CharacterDef {
    return PERSONAJES[this.index] ?? (PERSONAJES[0] as CharacterDef);
  }

  private cycle(dir: number): void {
    this.index = (this.index + dir + PERSONAJES.length) % PERSONAJES.length;
    this.sfx.play('carga', { pitch: 1.5 });
    this.build();
  }

  private cyclePasaje(): void {
    const open = pasajesOpen(this.data.pasajesGanados);
    this.data.pasaje = (Math.min(this.data.pasaje, open - 1) + 1) % open;
    this.hooks.save();
    this.sfx.play('carga', { pitch: 1.3 });
    this.build();
  }

  private choose(): void {
    if (!this.data.characters.includes(this.char.id)) return;
    this.data.character = this.char.id;
    this.hooks.save();
    this.hooks.go();
  }

  private build(): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const { w, h } = this;
    const portrait = h > w;
    const c = this.char;
    const unlocked = this.data.characters.includes(c.id);
    this.root.addChild(new Graphics().rect(0, 0, w, h).fill(C('K')));
    // Stripes behind the character, like a sticker album page.
    const stripes = new Graphics();
    for (let x = -h; x < w; x += 16) stripes.moveTo(x, h).lineTo(x + h, 0).stroke({ width: 6, color: C('k') });
    this.root.addChild(stripes);

    const title = new PixelText(t('menu.elegir'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), 8);
    this.root.addChild(title);

    // Big animated character (or its silhouette).
    const a = anim(c.sprite, unlocked ? 'trotar' : 'silueta');
    const big = new Sprite(a.textures[0]);
    big.anchor.set(0.5, 22 / 24);
    big.scale.set(portrait ? 4 : 5);
    const bx = portrait ? Math.round(w / 2) : Math.round(w * 0.3);
    const by = portrait ? 150 : Math.round(h * 0.62);
    big.position.set(bx, by);
    this.root.addChild(big);
    this.big = { sprite: big, anim: a };
    const name = new PixelText(unlocked ? t(c.nameKey) : t('meta.bloqueado'), { color: unlocked ? 'a' : 'G', outline: 'k' }, 2);
    name.position.set(Math.round(bx - name.width / 2), by + 14);
    this.root.addChild(name);

    const prev = new Button('<', 18, 22, () => this.cycle(-1), 'b', 'w');
    const next = new Button('>', 18, 22, () => this.cycle(1), 'b', 'w');
    prev.position.set(bx - 80, by - 40);
    next.position.set(bx + 62, by - 40);
    this.root.addChild(prev, next);

    // Stats panel.
    const px0 = portrait ? 14 : Math.round(w * 0.55);
    const py0 = portrait ? by + 40 : 40;
    const pw = portrait ? w - 28 : Math.round(w * 0.4);
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    let y = 6;
    if (unlocked) {
      const m = c.mods;
      const stat = (label: string, value: number, max: number, text: string): void => {
        const l = new PixelText(label, { color: 'w', outline: 'k' });
        l.position.set(6, y);
        const bw = pw - 70;
        const bar = new Graphics().rect(0, 0, bw, 5).fill(C('k')).rect(1, 1, Math.max(1, Math.round((bw - 2) * Math.min(1, value / max))), 3).fill(C('a'));
        bar.position.set(56, y + 1);
        const v = new PixelText(text, { color: 'G', outline: 'k' });
        v.position.set(pw - v.width - 4, y);
        box.addChild(l, bar, v);
        y += 11;
      };
      const hp = m.maxHp ?? PLAYER_BASE.maxHp;
      stat(t('menu.vida'), hp, 140, String(hp));
      stat(t('menu.velocidad'), m.speedMult ?? 1, 1.4, `${Math.round((m.speedMult ?? 1) * 100)}%`);
      stat(t('menu.critico'), PLAYER_BASE.critChance + (m.critBonus ?? 0), 0.3, `${Math.round((PLAYER_BASE.critChance + (m.critBonus ?? 0)) * 100)}%`);
      stat(t('menu.area'), m.areaMult ?? 1, 1.5, `${Math.round((m.areaMult ?? 1) * 100)}%`);
      y += 3;
      const weapon = ARMAS.find((wd) => wd.id === c.startingWeapon);
      const icon = new Sprite(anim('icono', c.startingWeapon).textures[0]);
      icon.position.set(6, y);
      const wl = new PixelText(`${t('menu.armaInicial')}: ${weapon ? t(`${weapon.i18n}.nombre`) : ''}`, { color: 'w', outline: 'k', maxWidth: pw - 30 });
      wl.position.set(26, y + 4);
      box.addChild(icon, wl);
      y += 20;
      const passive = new PixelText(t(`personajesPasiva.${c.id}`), { color: 'a', outline: 'k', maxWidth: pw - 12 });
      passive.position.set(6, y);
      box.addChild(passive);
      y += passive.height + 6;
    } else {
      const cond = new PixelText(this.condition(c), { color: 'w', outline: 'k', maxWidth: pw - 12 });
      cond.position.set(6, y);
      box.addChild(cond);
      y += cond.height + 6;
    }
    panel(g, 0, 0, pw, y + 2, 'k', 'K', 'g', 'k');
    box.position.set(px0, py0);
    this.root.addChild(box);

    // Fase 11.6: the pasaje (difficulty), once the first trip is won.
    let below = portrait ? h - 56 : py0 + y + 10;
    if (this.data.pasajesGanados > 0) {
      const open = pasajesOpen(this.data.pasajesGanados);
      const chosen = Math.min(this.data.pasaje, open - 1);
      const def = pasajeAt(chosen);
      const label = `${t('pasajes.cambiar', { nombre: t(`${def.i18n}.nombre`) })} (${t('pasajes.lucas', { n: `x${def.lucas}` })})`;
      const pas = new Button(label, portrait ? w - 28 : pw, 18, () => this.cyclePasaje(), 'b', 'w');
      pas.setEnabled(open > 1);
      pas.position.set(px0, below);
      this.root.addChild(pas);
      below += 24;
    }
    const go = new Button(t('menu.partir'), portrait ? w - 28 : pw, 24, () => this.choose(), 'a', 'k');
    go.setEnabled(unlocked);
    go.position.set(px0, portrait ? below : below);
    const back = new Button(t('menu.volver'), portrait ? w - 28 : pw, 18, () => this.hooks.back(), 'K', 'w');
    back.position.set(px0, go.y + 30);
    this.root.addChild(go, back);
    this.focus.set([go, back]);
  }

  private condition(c: CharacterDef): string {
    const u = c.unlock;
    switch (u.kind) {
      case 'inicio':
        return t('meta.condicion.inicio');
      case 'llegarA': {
        const city = CIUDADES.find((x) => x.id === u.ciudad);
        return t('meta.condicion.llegarA', { lugar: city ? t(city.i18n) : u.ciudad });
      }
      case 'total':
        return t(`meta.condicion.${u.stat}`, { n: formatNumber(u.cantidad) });
      case 'vencer': {
        const boss = JEFES.find((j) => j.id === u.jefe);
        return t('meta.condicion.vencer', { jefe: boss ? t(`${boss.i18n}.nombre`) : u.jefe });
      }
    }
  }

  update(dt: number): void {
    this.time += dt;
  }

  render(): void {
    if (!this.big) return;
    const tex = this.big.anim.textures[frameAt(this.big.anim, this.time)];
    if (tex) this.big.sprite.texture = tex;
  }
}
