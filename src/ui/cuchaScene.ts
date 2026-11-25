import { Container, Graphics, Sprite } from 'pixi.js';
import { anim, frameAt, type Anim } from '../art/assets.ts';
import { PAÑOLETAS } from '../art/sprites/quiltro.ts';
import { SUELO_PESOS } from '../art/sprites/suelos.ts';
import type { Sfx } from '../audio/sfx.ts';
import type { Input } from '../core/input.ts';
import type { Scene } from '../core/scene.ts';
import { CUCHA_PILARES, CUCHA_PILAR_NIVELES, MEJORAS, VECINOS, type UpgradeDef } from '../data/cucha.ts';
import { JEFES } from '../data/jefes.ts';
import { LOGROS } from '../data/logros.ts';
import { PERSONAJES, type CharacterDef } from '../data/personajes.ts';
import { CIUDADES } from '../data/zonas.ts';
import { FloorLayer } from '../game/world/floor.ts';
import { Horizon, HORIZON_H } from '../game/world/horizon.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { befriend, buy, idleEarnings, level, lucasPerHour, mainNeighbour, nextCost, pillarLevels } from '../meta/progress.ts';
import type { SaveData } from '../meta/save.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

export interface CuchaHooks {
  save(): void;
  travel(): void;
}

/** Where each upgrade object sits in the yard, from the doghouse's bottom centre. Landscape draws the house at ×3, portrait at ×2. */
const SPOTS_WIDE: Readonly<Record<string, { x: number; y: number }>> = {
  volantinExtra: { x: 0, y: -146 },
  buenaOnda: { x: 0, y: -102 },
  narizHumeda: { x: -52, y: -62 },
  segundaVida: { x: 52, y: -62 },
  collarNuevo: { x: -52, y: -20 },
  // Up and to the right of the character (who stands at +44, +6 and is about 44 px tall), never on top of it.
  cuentaRut: { x: 82, y: -50 },
  platoLleno: { x: 0, y: 14 },
  frazada: { x: -108, y: 6 },
  huesoDeCaracu: { x: -84, y: 18 },
  pelota: { x: 92, y: 16 },
  cuartaCarta: { x: 112, y: -8 },
  otraMano: { x: 140, y: 10 },
};
const SPOTS_TALL: Readonly<Record<string, { x: number; y: number }>> = {
  volantinExtra: { x: 0, y: -104 },
  buenaOnda: { x: 0, y: -66 },
  narizHumeda: { x: -34, y: -40 },
  segundaVida: { x: 34, y: -40 },
  collarNuevo: { x: -34, y: -12 },
  cuentaRut: { x: 66, y: -34 },
  platoLleno: { x: 0, y: 14 },
  frazada: { x: -78, y: 10 },
  huesoDeCaracu: { x: -58, y: 26 },
  pelota: { x: 64, y: 12 },
  cuartaCarta: { x: 96, y: 0 },
  otraMano: { x: 98, y: 22 },
};

/** Row height in the upgrades panel and the tab height. */
const ROW_H = 32;
const TAB_H = 16;

/**
 * La Cucha: the dog's home. A yard with the doghouse and every upgrade placed where it belongs
 * (greyed out until bought), the street with the neighbours (befriend them for idle lucas), a
 * panel that groups the upgrades in the four pillars (Garra, Aguante, Olfato, Barrio) with the
 * permanent bonus each pillar wakes up, the character picker, and the big ¡Viajar! button.
 */
export class CuchaScene implements Scene {
  readonly root = new Container();
  private readonly data: SaveData;
  private readonly hooks: CuchaHooks;
  private readonly sfx: Sfx;
  private readonly floor = new FloorLayer('suelo_sur', SUELO_PESOS.sur ?? [1], 3);
  private readonly horizon = new Horizon();
  private readonly layer = new Container();
  private readonly overlay = new Container();
  private viewW = 480;
  private viewH = 270;
  private time = 0;
  private tab = 'garra';
  /** The upgrade last touched (its row is highlighted). */
  private focus: string | null = null;
  private note = '';
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

    // Geometry. Landscape: yard on the left, panel on the right. Portrait: everything stacked.
    const panelW = portrait ? w - 12 : 156;
    const panelX = portrait ? 6 : w - panelW - 6;
    const houseScale = portrait ? 2 : 3;
    const cx = portrait ? Math.round(w / 2) : Math.round((panelX - 6) / 2);
    // A tall phone has room to spare: spread it above and below the yard instead of leaving a hole.
    const spare = portrait ? Math.max(0, Math.round((h - 480) / 2)) : 0;
    const cy = (portrait ? 150 : 186) + spare;
    const streetTop = (portrait ? 192 : 208) + spare;
    const streetH = portrait ? 34 : 38;
    const panelY = portrait ? streetTop + streetH + 6 : HORIZON_H + 4;

    // Street: a row of paving slabs with a kerb line.
    const slab = anim('suelo_centro', 'variantes').textures[0];
    const street = new Container();
    for (let y = 0; y < streetH; y += 16) {
      for (let x = 0; x < w; x += 16) {
        const s = new Sprite(slab);
        s.position.set(x, streetTop + y);
        street.addChild(s);
      }
    }
    const kerb = new Graphics();
    kerb.rect(0, streetTop - 2, w, 2).fill(C('G')).rect(0, streetTop, w, 1).fill(C('k'));
    street.addChild(kerb);
    this.layer.addChild(street);

    // Top bar: title, lucas and record.
    const title = new PixelText(t('meta.cuchaTitulo'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), 6);
    const lucas = new PixelText(t('meta.lucas', { n: formatNumber(this.data.lucas) }), { color: 'a', outline: 'k' }, 2);
    lucas.position.set(6, HORIZON_H + 4);
    this.layer.addChild(title, lucas);
    if (portrait) {
      const city = CIUDADES.find((c) => c.id === this.data.best.city);
      const record = new PixelText(t('meta.record', { km: formatNumber(this.data.best.km), lugar: city ? t(city.i18n) : '' }), { color: 'w', outline: 'k' });
      record.position.set(w - record.width - 6, HORIZON_H + 8);
      this.layer.addChild(record);
    }

    // The doghouse and the chosen character beside its door.
    const house = new Sprite(anim('cucha', 'quieto').textures[0]);
    house.anchor.set(0.5, 1);
    house.scale.set(houseScale);
    house.position.set(cx, cy);
    this.layer.addChild(house);
    const char = this.character();
    const suffix = char.id === 'quiltro' && this.data.bandana !== 'b' ? `@${this.data.bandana}` : '';
    const petAnim = anim(char.sprite, `quieto${suffix}`);
    const pet = new Sprite(petAnim.textures[0]);
    pet.anchor.set(0.5, 22 / 24);
    pet.position.set(cx + (portrait ? 30 : 44), cy + 6);
    pet.scale.set(portrait ? 1 : 2);
    this.layer.addChild(pet);
    this.pet = { sprite: pet, anim: petAnim };

    // Every upgrade is an object in the yard; greyed out until bought.
    const spots = portrait ? SPOTS_TALL : SPOTS_WIDE;
    for (const def of MEJORAS) {
      const spot = spots[def.id] ?? { x: 0, y: 0 };
      this.layer.addChild(this.objectButton(def, cx + spot.x, cy + spot.y));
    }

    // Neighbours along the street, with what they pay or cost under their feet.
    this.neighbours = [];
    const feet = streetTop + streetH - 12;
    const stepX = portrait ? 56 : 42;
    const startX = portrait ? Math.round((w - stepX * (VECINOS.length - 1)) / 2) : 28;
    VECINOS.forEach((v, i) => {
      const owned = this.data.vecinos.includes(v.id);
      const a = anim('vecino', owned ? v.id : `${v.id}_sombra`);
      const s = new Sprite(a.textures[0]);
      s.anchor.set(0.5, 1);
      s.position.set(startX + i * stepX, feet);
      s.eventMode = 'static';
      s.cursor = 'pointer';
      s.on('pointertap', () => this.askNeighbour(v.id));
      this.layer.addChild(s);
      this.neighbours.push({ sprite: s, anim: a, owned });
      const affordable = this.data.lucas >= v.cost;
      const tag = new PixelText(owned ? `+${v.lucasPerHour}/h` : formatNumber(v.cost), {
        color: owned ? 'V' : affordable ? 'a' : 'p',
        outline: 'k',
      });
      tag.position.set(Math.round(startX + i * stepX - tag.width / 2), feet + 3);
      this.layer.addChild(tag);
    });
    const perHour = new PixelText(t('meta.yaAmigo', { n: lucasPerHour(this.data) }), { color: 'w', outline: 'k' });
    // Beside the last neighbour (landscape) or under the street (portrait), clear of the yard objects.
    perHour.position.set(
      portrait ? Math.round((w - perHour.width) / 2) : startX + (VECINOS.length - 1) * stepX + 26,
      portrait ? streetTop - 12 : feet - 8,
    );
    this.layer.addChild(perHour);

    // The upgrades panel (tabs for the four pillars).
    const box = this.upgradesPanel(panelW);
    box.position.set(panelX, panelY);
    this.layer.addChild(box);
    const panelBottom = panelY + box.height + 4;

    // Character picker on a small plaque.
    const plaque = this.characterPlaque(panelW);
    plaque.position.set(panelX, portrait ? panelBottom : Math.min(panelBottom, h - 26 - plaque.height - 4));
    this.layer.addChild(plaque);

    // Bottom bar: bandana, achievements and the big travel button.
    const barY = h - 26;
    const unlockedChar = this.data.characters.includes(char.id);
    const travel = new Button(t('meta.viajar'), portrait ? w - 12 : 120, 22, () => this.travel(), 'a', 'k');
    travel.setEnabled(unlockedChar);
    if (portrait) {
      const rowY = barY - 24;
      this.layer.addChild(this.smallButtons(6, rowY, w - 12));
      travel.position.set(6, barY);
    } else {
      this.layer.addChild(this.smallButtons(6, barY, 140));
      travel.position.set(w - 126, barY);
    }
    this.layer.addChild(travel);

    // A short message (not enough lucas…) above the bottom bar.
    if (this.note) {
      const msg = new PixelText(this.note, { color: 'p', outline: 'k', maxWidth: w - 24, align: 'center' });
      msg.position.set(Math.round((portrait ? w : panelX) / 2 - msg.width / 2), streetTop - 24);
      this.layer.addChild(msg);
    }
  }

  private character(): CharacterDef {
    return PERSONAJES.find((p) => p.id === this.data.character) ?? (PERSONAJES[0] as CharacterDef);
  }

  /** Bandana and achievements buttons, side by side. */
  private smallButtons(x: number, y: number, width: number): Container {
    const row = new Container();
    const half = Math.floor((width - 6) / 2);
    let at = 0;
    if (this.character().id === 'quiltro' && this.bandanas().length > 1) {
      const band = new Button(t('meta.pañoleta'), half, 22, () => this.cycleBandana(), this.data.bandana === 'w' ? 'G' : this.data.bandana, 'w');
      band.position.set(0, 0);
      row.addChild(band);
      at = half + 6;
    }
    const logros = new Button(t('meta.logrosTitulo'), half, 22, () => this.showAchievements(), 'K', 'w');
    logros.position.set(at, 0);
    row.addChild(logros);
    row.position.set(x, y);
    return row;
  }

  private objectButton(def: UpgradeDef, x: number, y: number): Container {
    const box = new Container();
    const lvl = level(this.data, def.id);
    const focused = this.focus === def.id;
    const cost = nextCost(this.data, def);
    const affordable = cost !== null && this.data.lucas >= cost;
    const s = new Sprite(anim('objeto', def.id).textures[0]);
    s.anchor.set(0.5, 1);
    // Not bought yet: lavender grey, like a shape waiting to be filled.
    if (lvl === 0) s.tint = C('g');
    box.addChild(s);
    // Level dots under the object; a gold arrow over the focused one, a green one if affordable.
    const g = new Graphics();
    for (let i = 0; i < def.maxLevel; i++) g.rect(-def.maxLevel * 1.5 + i * 3, 2, 2, 2).fill(C(i < lvl ? 'a' : 'k'));
    if (focused || affordable) {
      const col = C(focused ? 'a' : 'V');
      g.poly([-3, -21, 3, -21, 0, -18]).fill(col).stroke({ width: 1, color: C('k') });
    }
    box.addChild(g);
    box.hitArea = { contains: (px: number, py: number) => px > -11 && px < 11 && py > -21 && py < 6 };
    box.position.set(x, y);
    box.eventMode = 'static';
    box.cursor = 'pointer';
    box.on('pointertap', () => this.focusUpgrade(def));
    return box;
  }

  /** The panel: four pillar tabs, the three upgrades of the open one (buy inline) and its permanent bonus. */
  private upgradesPanel(w: number): Container {
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    // Tabs.
    const tabW = Math.floor((w - 4) / CUCHA_PILARES.length);
    CUCHA_PILARES.forEach((p, i) => {
      const open = p.id === this.tab;
      const tab = new Container();
      const bg = new Graphics();
      bg.rect(0, open ? 0 : 2, tabW - 1, TAB_H - (open ? 0 : 2)).fill(C('k'));
      bg.rect(1, open ? 1 : 3, tabW - 3, TAB_H - (open ? 1 : 3)).fill(C(open ? p.color : 'K'));
      const label = new PixelText(t(`${p.i18n}.nombre`), { color: open ? 'W' : 'G', outline: open ? 'k' : null });
      label.position.set(Math.floor((tabW - 1 - label.width) / 2), open ? 5 : 6);
      tab.addChild(bg, label);
      tab.position.set(2 + i * tabW, 0);
      tab.eventMode = 'static';
      tab.cursor = 'pointer';
      tab.on('pointertap', () => this.openTab(p.id));
      box.addChild(tab);
    });
    const body = new Container();
    body.position.set(0, TAB_H);
    box.addChild(body);

    const pillar = CUCHA_PILARES.find((p) => p.id === this.tab) ?? (CUCHA_PILARES[0] as (typeof CUCHA_PILARES)[number]);
    const defs = MEJORAS.filter((m) => m.pillar === pillar.id);
    let y = 4;
    for (const def of defs) {
      const row = this.upgradeRow(def, w - 8);
      row.position.set(4, y);
      body.addChild(row);
      y += ROW_H;
    }

    // The pillar's permanent bonus: both tiers, gold once reached.
    const points = pillarLevels(this.data, pillar.id);
    const head = new PixelText(`${t(`${pillar.i18n}.nombre`)} ${points}/${CUCHA_PILAR_NIVELES[CUCHA_PILAR_NIVELES.length - 1]}`, { color: pillar.color === 'T' ? 't' : pillar.color, outline: 'k' });
    head.position.set(6, y + 2);
    body.addChild(head);
    y += head.height + 5;
    CUCHA_PILAR_NIVELES.forEach((n, i) => {
      const reached = points >= n;
      const line = new PixelText(t('cucha.bonoSiguiente', { n, bono: t(`${pillar.i18n}.bono${i + 1}`) }), {
        color: reached ? 'a' : 'G',
        outline: 'k',
        maxWidth: w - 12,
      });
      line.position.set(6, y);
      body.addChild(line);
      y += line.height + 3;
    });
    panel(g, 0, TAB_H - 1, w, y + 5, 'K', 'k', 'g', 'k');
    return box;
  }

  private upgradeRow(def: UpgradeDef, w: number): Container {
    const row = new Container();
    const lvl = level(this.data, def.id);
    const cost = nextCost(this.data, def);
    const bg = new Graphics();
    bg.rect(0, 0, w, ROW_H - 3).fill(C(this.focus === def.id ? 'g' : 'k'));
    row.addChild(bg);
    const name = new PixelText(t(def.nameKey), { color: 'a', outline: 'k', maxWidth: w - 8 - def.maxLevel * 4 });
    name.position.set(4, 3);
    const pips = new Graphics();
    for (let i = 0; i < def.maxLevel; i++) pips.rect(w - 4 - (def.maxLevel - i) * 4, 4, 3, 4).fill(C(i < lvl ? 'a' : 'K')).rect(w - 4 - (def.maxLevel - i) * 4, 4, 3, 1).fill(C('k'));
    const effect = new PixelText(t(`meta.efectos.${def.id}`), { color: 'w', outline: 'k', maxWidth: w - 62 });
    effect.position.set(4, 15);
    const label = cost === null ? t('meta.maximo') : formatNumber(cost);
    const b = new Button(label, 50, 14, () => this.buy(def), 'v', 'w');
    b.setEnabled(cost !== null && this.data.lucas >= cost);
    b.position.set(w - 52, ROW_H - 3 - 16);
    row.addChild(name, pips, effect, b);
    return row;
  }

  private characterPlaque(w: number): Container {
    const box = new Container();
    const g = new Graphics();
    box.addChild(g);
    const char = this.character();
    const has = this.data.characters.includes(char.id);
    const prev = new Button('<', 16, 16, () => this.cycleCharacter(-1), 'K', 'w');
    const next = new Button('>', 16, 16, () => this.cycleCharacter(1), 'K', 'w');
    const name = new PixelText(has ? t(char.nameKey) : t('meta.bloqueado'), { color: has ? 'w' : 'g', outline: 'k' });
    prev.position.set(4, 4);
    next.position.set(w - 20, 4);
    name.position.set(Math.round((w - name.width) / 2), 8);
    box.addChild(prev, next, name);
    let h = 24;
    if (!has) {
      const cond = new PixelText(this.condition(char), { color: 'G', outline: 'k', maxWidth: w - 12, align: 'center' });
      cond.position.set(Math.round((w - cond.width) / 2), 22);
      box.addChild(cond);
      h = 22 + cond.height + 4;
    }
    panel(g, 0, 0, w, h, 'K', 'k', 'g', 'k');
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

  private openTab(id: string): void {
    if (this.tab === id) return;
    this.tab = id;
    this.note = '';
    this.sfx.play('carga', { pitch: 1.6 });
    this.build();
  }

  /** Touching an object in the yard opens its pillar and highlights its row. */
  private focusUpgrade(def: UpgradeDef): void {
    this.tab = def.pillar;
    this.focus = def.id;
    this.note = '';
    this.sfx.play('carga', { pitch: 1.6 });
    this.build();
  }

  private buy(def: UpgradeDef): void {
    this.focus = def.id;
    if (!buy(this.data, def.id)) {
      const cost = nextCost(this.data, def);
      this.note = cost === null ? '' : t('ui.sinLucas', { n: formatNumber(cost - this.data.lucas) });
      this.build();
      return;
    }
    this.note = '';
    this.sfx.play('campana');
    this.hooks.save();
    this.build();
  }

  /** Tap on a neighbour: becomes a friend if there are enough lucas, otherwise says how many are missing. */
  private askNeighbour(id: string): void {
    const v = VECINOS.find((n) => n.id === id);
    if (!v || this.data.vecinos.includes(id)) return;
    if (!befriend(this.data, id)) {
      this.note = t('ui.sinLucas', { n: formatNumber(v.cost - this.data.lucas) });
      this.build();
      return;
    }
    this.note = '';
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
