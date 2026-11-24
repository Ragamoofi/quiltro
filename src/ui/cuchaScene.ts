import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../art/assets.ts';
import { PAÑOLETAS } from '../art/sprites/quiltro.ts';
import { SUELO_CENTRO_PESOS } from '../art/sprites/suelos.ts';
import type { Sfx } from '../audio/sfx.ts';
import type { Input } from '../core/input.ts';
import type { Scene } from '../core/scene.ts';
import { MEJORAS, VECINOS, type UpgradeDef } from '../data/cucha.ts';
import { JEFES } from '../data/jefes.ts';
import { LOGROS } from '../data/logros.ts';
import { PERSONAJES, type CharacterDef } from '../data/personajes.ts';
import { CIUDADES } from '../data/zonas.ts';
import { FloorLayer } from '../game/world/floor.ts';
import { Horizon, HORIZON_H } from '../game/world/horizon.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { befriend, buy, idleEarnings, level, lucasPerHour, mainNeighbour, nextCost } from '../meta/progress.ts';
import type { SaveData } from '../meta/save.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

export interface CuchaHooks {
  save(): void;
  travel(): void;
}

type Selection = { kind: 'mejora'; def: UpgradeDef } | { kind: 'vecino'; id: string } | null;

/** Where each upgrade object sits, relative to the doghouse's bottom centre (house drawn at ×2: 112×88). */
const SPOTS: Readonly<Record<string, { x: number; y: number }>> = {
  volantinExtra: { x: 0, y: -104 },
  buenaOnda: { x: 0, y: -66 },
  narizHumeda: { x: -34, y: -40 },
  segundaVida: { x: 34, y: -40 },
  collarNuevo: { x: -34, y: -12 },
  cuentaRut: { x: 34, y: -12 },
  platoLleno: { x: 0, y: 14 },
  frazada: { x: -78, y: 10 },
  huesoDeCaracu: { x: -58, y: 30 },
  pelota: { x: 64, y: 10 },
  cuartaCarta: { x: 98, y: 6 },
  otraMano: { x: 98, y: -6 },
};

/**
 * La Cucha: the dog's home. Each permanent upgrade is an object in the yard
 * (plate, blanket, ball…); tap one to see it and buy the next level. Below,
 * the street with the neighbours (befriend them for idle lucas). Character
 * and bandana pickers, achievements, and the big ¡Viajar! button.
 */
export class CuchaScene implements Scene {
  readonly root = new Container();
  private readonly data: SaveData;
  private readonly hooks: CuchaHooks;
  private readonly sfx: Sfx;
  private readonly floor = new FloorLayer('suelo_centro', SUELO_CENTRO_PESOS, 3);
  private readonly horizon = new Horizon();
  private readonly layer = new Container();
  private readonly overlay = new Container();
  private viewW = 480;
  private viewH = 270;
  private time = 0;
  private selection: Selection = null;
  private pet: { sprite: Sprite; anim: Anim } | null = null;
  private neighbours: { sprite: Sprite; anim: Anim; owned: boolean }[] = [];
  private pendingIdle = 0;

  constructor(input: Input, sfx: Sfx, data: SaveData, hooks: CuchaHooks) {
    this.data = data;
    this.hooks = hooks;
    this.sfx = sfx;
    this.root.addChild(this.floor.root, this.horizon.root, this.layer, this.overlay);
    input.onPress('Enter', () => this.travel());
    input.onPress('Space', () => this.travel());
    input.onPress('Escape', () => this.closeOverlay());
    input.onPress('KeyR', () => this.travel());
  }

  enter(): void {
    const now = Date.now();
    const idle = idleEarnings(this.data, now);
    this.pendingIdle = idle.lucas;
    if (this.pendingIdle > 0) this.showIdle();
    else {
      this.data.lastSeen = now;
      this.hooks.save();
    }
  }

  exit(): void {}

  resize(width: number, height: number): void {
    this.viewW = width;
    this.viewH = height;
    this.floor.resize(width, height);
    this.horizon.setZone('centro', width);
    this.build();
  }

  update(dt: number): void {
    this.time += dt;
  }

  render(): void {
    this.floor.update(0, 0);
    this.horizon.update(this.time * 20, this.time);
    if (this.pet) {
      const tex = this.pet.anim.textures[frameAt(this.pet.anim, this.time)];
      if (tex) this.pet.sprite.texture = tex;
    }
    for (const n of this.neighbours) {
      if (!n.owned) continue;
      const tex = n.anim.textures[frameAt(n.anim, this.time + n.sprite.x * 0.01)];
      if (tex) n.sprite.texture = tex;
    }
  }

  // ---------------------------------------------------------------- layout

  private get portrait(): boolean {
    return this.viewH > this.viewW;
  }

  /** Rebuilds the whole screen (after any purchase or choice). */
  private build(): void {
    this.layer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const w = this.viewW;
    const h = this.viewH;
    const portrait = this.portrait;

    // Top bar: lucas and record.
    const lucas = new PixelText(t('meta.lucas', { n: formatNumber(this.data.lucas) }), { color: 'a', outline: 'k' }, 2);
    lucas.position.set(6, HORIZON_H + 2);
    const city = CIUDADES.find((c) => c.id === this.data.best.city);
    const record = new PixelText(t('meta.record', { km: formatNumber(this.data.best.km), lugar: city ? t(city.i18n) : '' }), { color: 'w', outline: 'k' });
    record.position.set(w - record.width - 6, HORIZON_H + 6);
    const title = new PixelText(t('meta.cuchaTitulo'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), 6);
    this.layer.addChild(lucas, record, title);

    // The doghouse (×2) and the chosen character in front of it.
    const cx = portrait ? Math.round(w / 2) : 180;
    const cy = portrait ? 210 : 196;
    const house = new Sprite(anim('cucha', 'quieto').textures[0]);
    house.anchor.set(0.5, 1);
    house.scale.set(2);
    house.position.set(cx, cy);
    this.layer.addChild(house);
    const char = this.character();
    const suffix = char.id === 'quiltro' && this.data.bandana !== 'b' ? `@${this.data.bandana}` : '';
    const petAnim = anim(char.sprite, `quieto${suffix}`);
    const pet = new Sprite(petAnim.textures[0]);
    pet.anchor.set(0.5, 22 / 24);
    pet.position.set(cx - 30, cy + 8);
    pet.scale.x = -1;
    this.layer.addChild(pet);
    this.pet = { sprite: pet, anim: petAnim };

    // Each upgrade is an object in or around La Cucha (GDD: objects, not a list).
    for (const def of MEJORAS) {
      const spot = SPOTS[def.id] ?? { x: 0, y: 0 };
      this.layer.addChild(this.objectButton(def, cx + spot.x, cy + spot.y));
    }

    // Detail panel for the selection.
    const dx = portrait ? 10 : 340;
    const dy = portrait ? cy + 36 : HORIZON_H + 30;
    const dw = portrait ? w - 20 : w - 346;
    if (!this.selection) this.selection = { kind: 'mejora', def: MEJORAS[0] as UpgradeDef };
    this.layer.addChild(this.detail(dx, dy, dw));

    // Neighbours along the street.
    this.neighbours = [];
    const ny = portrait ? h - 86 : 150;
    const nx = portrait ? Math.round(w / 2) - 45 : 22;
    const step = portrait ? 30 : 22;
    const perHour = new PixelText(t('meta.yaAmigo', { n: lucasPerHour(this.data) }), { color: 'w', outline: 'k' });
    perHour.position.set(nx - 8, ny - 34);
    this.layer.addChild(perHour);
    VECINOS.forEach((v, i) => {
      const owned = this.data.vecinos.includes(v.id);
      const a = anim('vecino', owned ? v.id : `${v.id}_sombra`);
      const s = new Sprite(a.textures[0]);
      s.anchor.set(0.5, 1);
      s.position.set(nx + i * step, ny);
      s.eventMode = 'static';
      s.cursor = 'pointer';
      s.on('pointertap', () => this.select({ kind: 'vecino', id: v.id }));
      this.layer.addChild(s);
      this.neighbours.push({ sprite: s, anim: a, owned });
    });

    // Character + bandana pickers, achievements, travel.
    const by = h - 24;
    const pickY = portrait ? h - 56 : by;
    this.layer.addChild(this.characterPicker(portrait ? 10 : 200, pickY));
    const logros = new Button(t('meta.logrosTitulo'), 56, 18, () => this.showAchievements(), 'K', 'w');
    logros.position.set(portrait ? w - 66 : 200 + 150, pickY + 2);
    this.layer.addChild(logros);
    const unlockedChar = this.data.characters.includes(char.id);
    const travel = new Button(t('meta.viajar'), portrait ? w - 20 : 80, 22, () => this.travel(), 'a', 'k');
    travel.setEnabled(unlockedChar);
    travel.position.set(portrait ? 10 : w - 88, portrait ? h - 30 : by - 2);
    this.layer.addChild(travel);
  }

  private character(): CharacterDef {
    return PERSONAJES.find((p) => p.id === this.data.character) ?? (PERSONAJES[0] as CharacterDef);
  }

  private objectButton(def: UpgradeDef, x: number, y: number): Container {
    const box = new Container();
    const lvl = level(this.data, def.id);
    const selected = this.selection?.kind === 'mejora' && this.selection.def.id === def.id;
    const cost = nextCost(this.data, def);
    const affordable = cost !== null && this.data.lucas >= cost;
    const s = new Sprite(anim('objeto', def.id).textures[0]);
    s.anchor.set(0.5, 1);
    box.addChild(s);
    // Level dots under the object; a gold arrow over the selected one, a green one if affordable.
    const g = new Graphics();
    for (let i = 0; i < def.maxLevel; i++) g.rect(-def.maxLevel * 1.5 + i * 3, 2, 2, 2).fill(C(i < lvl ? 'a' : 'k'));
    if (selected || affordable) {
      const col = C(selected ? 'a' : 'V');
      g.poly([-3, -21, 3, -21, 0, -18]).fill(col).stroke({ width: 1, color: C('k') });
    }
    box.addChild(g);
    box.hitArea = { contains: (px: number, py: number) => px > -10 && px < 10 && py > -20 && py < 5 };
    box.position.set(x, y);
    box.eventMode = 'static';
    box.cursor = 'pointer';
    box.on('pointertap', () => this.select({ kind: 'mejora', def }));
    return box;
  }

  private detail(x: number, y: number, w: number): Container {
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    const sel = this.selection;
    let yy = 6;
    const line = (text: string, color: string, scale = 1): void => {
      const tx = new PixelText(text, { color, outline: 'k', maxWidth: Math.floor((w - 12) / scale) }, scale);
      tx.position.set(6, yy);
      box.addChild(tx);
      yy += tx.height + 4;
    };
    if (sel?.kind === 'mejora') {
      const def = sel.def;
      const lvl = level(this.data, def.id);
      line(t(def.nameKey), 'a');
      line(t('meta.nivelDe', { de: lvl, max: def.maxLevel }), 'G');
      line(t(`meta.efectos.${def.id}`), 'w');
      const cost = nextCost(this.data, def);
      const label = cost === null ? t('meta.maximo') : t('meta.comprar', { n: formatNumber(cost) });
      const b = new Button(label, w - 12, 18, () => this.buy(def), 'v', 'w');
      b.setEnabled(cost !== null && this.data.lucas >= cost);
      b.position.set(6, yy + 2);
      box.addChild(b);
      yy += 24;
      if (cost !== null && this.data.lucas < cost) line(t('ui.sinLucas', { n: formatNumber(cost - this.data.lucas) }), 'p');
    } else if (sel?.kind === 'vecino') {
      const v = VECINOS.find((n) => n.id === sel.id);
      if (v) {
        line(t(v.nameKey), 'a');
        line(t('meta.yaAmigo', { n: v.lucasPerHour }), 'w');
        if (!this.data.vecinos.includes(v.id)) {
          const b = new Button(t('meta.amigo', { n: formatNumber(v.cost) }), w - 12, 18, () => this.befriend(v.id), 'v', 'w');
          b.setEnabled(this.data.lucas >= v.cost);
          b.position.set(6, yy + 2);
          box.addChild(b);
          yy += 24;
        }
      }
    }
    panel(g, 0, 0, w, yy + 4, 'K', 'k', 'g', 'k');
    box.position.set(x, y);
    return box;
  }

  private characterPicker(x: number, y: number): Container {
    const box = new Container();
    const unlocked = this.data.characters;
    const char = this.character();
    const has = unlocked.includes(char.id);
    const prev = new Button('<', 14, 18, () => this.cycleCharacter(-1), 'K', 'w');
    const next = new Button('>', 14, 18, () => this.cycleCharacter(1), 'K', 'w');
    const name = new PixelText(has ? t(char.nameKey) : t('meta.bloqueado'), { color: has ? 'w' : 'g', outline: 'k' });
    const cond = has ? null : new PixelText(this.condition(char), { color: 'G', outline: 'k' });
    prev.position.set(0, 2);
    name.position.set(18, 2);
    next.position.set(22 + Math.max(name.width, 90), 2);
    box.addChild(prev, name, next);
    if (cond) {
      cond.position.set(18, 12);
      box.addChild(cond);
    }
    // Bandana colours (only the quiltro wears one).
    if (char.id === 'quiltro') {
      const colors = this.bandanas();
      if (colors.length > 1) {
        const band = new Button(t('meta.pañoleta'), 52, 18, () => this.cycleBandana(), this.data.bandana === 'w' ? 'G' : this.data.bandana, 'w');
        band.position.set(-60, 2);
        box.addChild(band);
      }
    }
    box.position.set(x, y);
    return box;
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

  private bandanas(): string[] {
    const fromAchievements = LOGROS.filter((l) => this.data.achievements.includes(l.id)).map((l) => l.bandana);
    return ['b', ...fromAchievements.filter((c) => c in PAÑOLETAS)];
  }

  // ---------------------------------------------------------------- actions

  private select(s: Selection): void {
    this.selection = s;
    this.sfx.play('carga', { pitch: 1.6 });
    this.build();
  }

  private buy(def: UpgradeDef): void {
    if (!buy(this.data, def.id)) return;
    this.sfx.play('campana');
    this.hooks.save();
    this.build();
  }

  private befriend(id: string): void {
    if (!befriend(this.data, id)) return;
    this.sfx.play('campana', { pitch: 1.2 });
    this.hooks.save();
    this.build();
  }

  private cycleCharacter(dir: number): void {
    const i = PERSONAJES.findIndex((p) => p.id === this.data.character);
    const next = PERSONAJES[(i + dir + PERSONAJES.length) % PERSONAJES.length];
    if (next) this.data.character = next.id;
    this.hooks.save();
    this.build();
  }

  private cycleBandana(): void {
    const colors = this.bandanas();
    const i = colors.indexOf(this.data.bandana);
    this.data.bandana = colors[(i + 1) % colors.length] ?? 'b';
    this.hooks.save();
    this.build();
  }

  private travel(): void {
    if (this.overlay.children.length > 0) return;
    if (!this.data.characters.includes(this.data.character)) return;
    this.sfx.play('guau');
    this.hooks.travel();
  }

  // ---------------------------------------------------------------- overlays

  private closeOverlay(): void {
    this.overlay.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  private showIdle(): void {
    this.closeOverlay();
    this.overlay.addChild(ditherOverlay(this.viewW, this.viewH));
    const w = Math.min(this.viewW - 20, 260);
    const box = new Container();
    const g = new Graphics();
    const text = new PixelText(t('meta.idle', { vecino: t(mainNeighbour(this.data)), n: this.pendingIdle }), {
      color: 'w',
      outline: 'k',
      maxWidth: w - 16,
      align: 'center',
    });
    const b = new Button(t('meta.recoger'), 80, 20, () => {
      this.data.lucas += this.pendingIdle;
      this.data.lastSeen = Date.now();
      this.pendingIdle = 0;
      this.sfx.play('campana');
      this.hooks.save();
      this.closeOverlay();
      this.build();
    }, 'a', 'k');
    const h = text.height + 44;
    panel(g, 0, 0, w, h, 'K', 'k', 'g', 'k');
    text.position.set(Math.round((w - text.width) / 2), 10);
    b.position.set(Math.round((w - 80) / 2), h - 28);
    box.addChild(g, text, b);
    box.position.set(Math.round((this.viewW - w) / 2), Math.round((this.viewH - h) / 2));
    this.overlay.addChild(box);
  }

  private showAchievements(): void {
    this.closeOverlay();
    this.overlay.addChild(ditherOverlay(this.viewW, this.viewH));
    const w = Math.min(this.viewW - 20, 300);
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    let y = 8;
    const title = new PixelText(t('meta.logrosTitulo'), { color: 'a', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), y);
    box.addChild(title);
    y += title.height + 6;
    for (const l of LOGROS) {
      const got = this.data.achievements.includes(l.id);
      const hidden = l.secret && !got;
      const name = new PixelText(`${got ? '+' : '·'} ${hidden ? '???' : t(`${l.i18n}.nombre`)}`, { color: got ? 'a' : 'G', outline: 'k' });
      const desc = new PixelText(hidden ? '???' : `${t(`${l.i18n}.desc`)} (${l.lucas})`, { color: got ? 'w' : 'g', outline: 'k', maxWidth: w - 24 });
      const swatch = new Graphics().rect(0, 0, 6, 6).fill(C(l.bandana)).stroke({ width: 1, color: C('k') });
      swatch.position.set(w - 16, y + 1);
      name.position.set(10, y);
      desc.position.set(18, y + name.height + 1);
      box.addChild(name, desc, swatch);
      y += name.height + desc.height + 5;
    }
    const close = new Button(t('meta.cerrar'), 70, 18, () => this.closeOverlay(), 'K', 'w');
    close.position.set(Math.round((w - 70) / 2), y + 2);
    box.addChild(close);
    panel(g, 0, 0, w, y + 26, 'K', 'k', 'g', 'k');
    box.position.set(Math.round((this.viewW - w) / 2), Math.max(4, Math.round((this.viewH - y - 26) / 2)));
    this.overlay.addChild(box);
  }
}
