import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { anim, firstFrame, hasAnim } from '../art/assets.ts';
import { ARMAS } from '../data/armas.ts';
import { ENEMIGOS, ENEMIGOS_ESPECIALES } from '../data/enemigos.ts';
import { EVOLUCIONES } from '../data/evoluciones.ts';
import { JEFES } from '../data/jefes.ts';
import { LOGROS } from '../data/logros.ts';
import { PERSONAJES } from '../data/personajes.ts';
import { formatNumber, hasKey, t } from '../i18n/index.ts';
import type { SaveData } from '../meta/save.ts';
import { OBJECTIVES } from '../meta/objectives.ts';
import { RELICS } from '../game/systems/fairChallenge.ts';
import { PixelText } from './text.ts';
import { Button, C, ditherOverlay, panel } from './widgets.ts';

/** What the view reads from the save. */
export type AchievementsSave = Pick<SaveData, 'achievements' | 'bestiary' | 'bossesBeaten' | 'totals' | 'best' | 'bestRunLucas' | 'stats' | 'pasajesGanados' | 'history'>;

type Tab = 'logros' | 'bestiario' | 'estadisticas' | 'historial' | 'objetivos';

/** The key with the most votes in a count table, with its count. */
export function topOf(table: Readonly<Record<string, number>>): { id: string; n: number } | null {
  let best: { id: string; n: number } | null = null;
  for (const [id, n] of Object.entries(table)) if (n > (best?.n ?? 0)) best = { id, n };
  return best;
}

/** A readable name for what killed the dog: an enemy, a boss or one of the dangers of the road. */
export function causeName(id: string): string {
  const enemy = [...ENEMIGOS, ...ENEMIGOS_ESPECIALES].find((e) => e.id === id);
  if (enemy) return t(enemy.nameKey);
  const boss = JEFES.find((j) => j.id === id);
  if (boss) return t(`${boss.i18n}.nombre`);
  return hasKey(`estadisticas.causa.${id}`) ? t(`estadisticas.causa.${id}`) : id;
}

/** The lines of the statistics tab: label and value. */
export function statLines(save: AchievementsSave): { label: string; value: string }[] {
  const char = topOf(save.stats.characters);
  const death = topOf(save.stats.deaths);
  return [
    { label: t('estadisticas.mejorKm'), value: `${formatNumber(Math.round(save.best.km))} km` },
    { label: t('estadisticas.mejorLucas'), value: formatNumber(save.bestRunLucas) },
    { label: t('estadisticas.viajes'), value: formatNumber(save.totals.runs) },
    { label: t('estadisticas.enemigos'), value: formatNumber(save.totals.kills) },
    { label: t('estadisticas.sopaipillas'), value: formatNumber(save.totals.sopaipillas) },
    { label: t('estadisticas.lucas'), value: formatNumber(save.totals.lucasEarned) },
    { label: t('estadisticas.personaje'), value: char ? `${t(PERSONAJES.find((c) => c.id === char.id)?.nameKey ?? 'personajes.quiltro')} (${char.n})` : '-' },
    { label: t('estadisticas.muerte'), value: death ? `${causeName(death.id)} (${death.n})` : '-' },
    { label: t('estadisticas.pasajes'), value: `${save.pasajesGanados}/3` },
  ];
}

/** Sprite shown for each boss in the bestiary (the Taco is drawn as a car). */
const BOSS_SPRITE: Readonly<Record<string, string>> = { alicanto: 'alicanto', taco: 'auto', caleuche: 'caleuche', caiCai: 'caiCai' };

interface Entry {
  kind: 'enemigo' | 'jefe' | 'arma' | 'evolucion';
  name: string;
  texture: Texture | undefined;
  seen: boolean;
  /** Times beaten (enemies only). */
  count: number;
}

/** Every entry of the bestiary, in the order enemies, bosses, weapons, evolutions. */
export function bestiaryEntries(save: AchievementsSave): Entry[] {
  const out: Entry[] = [];
  for (const e of [...ENEMIGOS, ...ENEMIGOS_ESPECIALES.filter((x) => x.id === 'puma')]) {
    const n = save.bestiary.kills[e.id] ?? 0;
    out.push({ kind: 'enemigo', name: t(e.nameKey), texture: firstFrame(e.id), seen: n > 0, count: n });
  }
  for (const j of JEFES) {
    out.push({ kind: 'jefe', name: t(`${j.i18n}.nombre`), texture: firstFrame(BOSS_SPRITE[j.id] ?? j.id), seen: save.bossesBeaten.includes(j.id), count: 0 });
  }
  for (const a of ARMAS.filter((x) => x.takesSlot)) {
    out.push({ kind: 'arma', name: t(`${a.i18n}.nombre`), texture: hasAnim('icono', a.id) ? anim('icono', a.id).textures[0] : undefined, seen: save.bestiary.weapons.includes(a.id), count: 0 });
  }
  for (const e of EVOLUCIONES) {
    const icon = hasAnim('icono', e.id) ? e.id : e.weapon;
    out.push({ kind: 'evolucion', name: t(e.nameKey), texture: hasAnim('icono', icon) ? anim('icono', icon).textures[0] : undefined, seen: save.bestiary.evolutions.includes(e.id), count: 0 });
  }
  return out;
}

const KIND_COLOR: Readonly<Record<Entry['kind'], string>> = { enemigo: 'r', jefe: 'a', arma: 'b', evolucion: 'p' };

/**
 * Achievements and bestiary in one panel, two tabs, with pages. Secret achievements stay hidden
 * until earned; bestiary entries show a silhouette until the dog has beaten, used or seen them.
 */
export function achievementsView(save: SaveData, viewW: number, viewH: number, onClose: () => void, startTab: Tab = 'objetivos'): Container {
  const root = new Container();
  root.addChild(ditherOverlay(viewW, viewH));
  const w = Math.min(viewW - 16, 320);
  const h = Math.min(viewH - 12, 330);
  const box = new Container();
  const g = new Graphics();
  panel(g, 0, 0, w, h, 'K', 'k', 'g', 'k');
  box.addChild(g);
  box.position.set(Math.round((viewW - w) / 2), Math.round((viewH - h) / 2));
  root.addChild(box);

  const body = new Container();
  box.addChild(body);
  let tab = startTab;
  let page = 0;

  const TOP = 40;
  const BOTTOM = 26;
  const area = h - TOP - BOTTOM;

  const draw = (): void => {
    body.removeChildren().forEach((c) => c.destroy({ children: true }));
    const title = new PixelText(tab === 'objetivos' ? 'Objetivos' : tab === 'historial' ? 'Historial de viajes' : t(tab === 'logros' ? 'meta.logrosTitulo' : tab === 'bestiario' ? 'meta.bestiarioTitulo' : 'meta.estadisticasTitulo'), { color: 'a', outline: 'k' }, 2);
    title.position.set(Math.round((w - title.width) / 2), 5);
    body.addChild(title);

    // Tabs.
    const half = Math.floor((w - 28) / 5);
    const tabs: { id: Tab; label: string }[] = [
      { id: 'logros', label: t('meta.pestanaLogros') },
      { id: 'bestiario', label: t('meta.pestanaBestiario') },
      { id: 'objetivos', label: 'Metas' },
      { id: 'historial', label: 'Viajes' },
      { id: 'estadisticas', label: t('meta.pestanaEstadisticas') },
    ];
    tabs.forEach((tb, i) => {
      const b = new Button(tb.label, half, 14, () => {
        tab = tb.id;
        page = 0;
        draw();
      }, tab === tb.id ? 'a' : 'K', tab === tb.id ? 'k' : 'w');
      b.position.set(10 + i * (half + 4), 22);
      body.addChild(b);
    });

    let pages = 1;
    if (tab === 'logros') {
      const rowH = 25;
      const per = Math.max(3, Math.floor(area / rowH));
      pages = Math.max(1, Math.ceil(LOGROS.length / per));
      page = Math.min(page, pages - 1);
      const got = save.achievements.length;
      const count = new PixelText(`${got}/${LOGROS.length}`, { color: 'w', outline: 'k' });
      count.position.set(w - count.width - 8, 8);
      body.addChild(count);
      LOGROS.slice(page * per, page * per + per).forEach((l, i) => {
        const y = TOP + 4 + i * rowH;
        const earned = save.achievements.includes(l.id);
        const hidden = l.secret && !earned;
        const name = new PixelText(`${earned ? '+' : '·'} ${hidden ? '???' : t(`${l.i18n}.nombre`)}`, { color: earned ? 'a' : 'G', outline: 'k' });
        const desc = new PixelText(hidden ? '???' : `${t(`${l.i18n}.desc`)} (${l.lucas})`, { color: earned ? 'w' : 'g', outline: 'k', maxWidth: w - 40 });
        name.position.set(10, y);
        desc.position.set(18, y + name.height + 1);
        body.addChild(name, desc);
        if (l.bandana) {
          const swatch = new Graphics().rect(0, 0, 6, 6).fill(C(l.bandana)).stroke({ width: 1, color: C('k') });
          swatch.position.set(w - 16, y + 1);
          body.addChild(swatch);
        }
      });
    } else if (tab === 'objetivos') {
      OBJECTIVES.forEach((goal, i) => {
        const claimed = save.claimedObjectives?.includes(goal.id);
        const progress = Math.min(goal.target, goal.progress(save));
        const unit = goal.id === 'temuco' ? ' km' : goal.id === 'weapons' ? ' evoluciones' : ' personajes';
        const label = new PixelText(goal.name, { color: 'a', maxWidth: w - 24 });
        const detail = new PixelText(formatNumber(progress) + '/' + formatNumber(goal.target) + unit
          + ' · ' + goal.reward + ' lucas' + (claimed ? ' cobradas' : ''), { color: 'w', maxWidth: w - 24 });
        label.position.set(12, TOP + 8 + i * 42);
        detail.position.set(12, label.y + label.height + 4);
        body.addChild(label, detail);
      });
    } else if (tab === 'historial') {
      const history = Array.isArray(save.history) ? save.history : [];
      pages = Math.max(1, history.length);
      const trip = history[page];
      const character = PERSONAJES.find(c => c.id === trip?.character);
      const lines = trip ? [
        character ? t(character.nameKey) : trip.character,
        formatNumber(trip.km) + ' km · ' + Math.floor(trip.seconds / 60) + ' min · Pasaje ' + (trip.pasaje + 1),
        trip.deathBy ? 'Caída: ' + causeName(trip.deathBy) : 'Viaje registrado',
        'Armas: ' + trip.weapons.map(id => {
          const weapon = ARMAS.find(a => a.id === id);
          return weapon ? t(weapon.i18n + '.nombre') : id;
        }).join(', '),
        'Evoluciones: ' + (trip.evolutions.map(id => t(EVOLUCIONES.find(e => e.id === id)?.nameKey ?? id)).join(', ') || 'ninguna'),
        'Reliquias: ' + (trip.relics.flatMap(id => RELICS[id]?.name ?? []).join(', ') || 'ninguna'),
      ] : ['Todavía no hay viajes registrados.'];
      let y = TOP + 8;
      lines.forEach((line, i) => {
        const text = new PixelText(line, { color: i ? 'w' : 'a', maxWidth: w - 24 });
        text.position.set(12, y);
        y += text.height + 7;
        body.addChild(text);
      });
    } else if (tab === 'estadisticas') {
      const lines = statLines(save);
      const rowH = Math.max(14, Math.min(22, Math.floor(area / lines.length)));
      lines.forEach((ln, i) => {
        const y = TOP + 6 + i * rowH;
        const label = new PixelText(ln.label, { color: 'w', outline: 'k' });
        const value = new PixelText(ln.value, { color: 'a', outline: 'k' });
        label.position.set(12, y);
        value.position.set(w - value.width - 12, y);
        const rule = new Graphics().rect(10, y + label.height + 2, w - 20, 1).fill(C('g'));
        body.addChild(label, value, rule);
      });
    } else {
      const entries = bestiaryEntries(save);
      const cellW = 62;
      const cellH = 56;
      const cols = Math.max(2, Math.floor((w - 12) / cellW));
      const rows = Math.max(1, Math.floor(area / cellH));
      const per = cols * rows;
      pages = Math.max(1, Math.ceil(entries.length / per));
      page = Math.min(page, pages - 1);
      const seen = entries.filter((e) => e.seen).length;
      const count = new PixelText(t('meta.bestiarioVistos', { n: seen, total: entries.length }), { color: 'w', outline: 'k' });
      count.position.set(w - count.width - 8, 8);
      body.addChild(count);
      const x0 = Math.round((w - cols * cellW) / 2);
      entries.slice(page * per, page * per + per).forEach((e, i) => {
        const cx = x0 + (i % cols) * cellW;
        const cy = TOP + 4 + Math.floor(i / cols) * cellH;
        const cell = new Graphics();
        panel(cell, cx + 2, cy, cellW - 4, cellH - 4, 'k', 'g', 'K', 'k');
        cell.rect(cx + 3, cy + 1, 2, cellH - 6).fill(C(KIND_COLOR[e.kind]));
        body.addChild(cell);
        if (e.texture) {
          const s = new Sprite(e.texture);
          s.anchor.set(0.5);
          const big = Math.max(e.texture.width, e.texture.height);
          s.scale.set(big > 36 ? 0.5 : big <= 18 ? 2 : 1);
          s.position.set(cx + cellW / 2, cy + 16);
          // Not met yet: a flat dark silhouette.
          if (!e.seen) s.tint = 0x2a2233;
          body.addChild(s);
        }
        const label = new PixelText(e.seen ? e.name : '???', { color: e.seen ? 'w' : 'g', outline: 'k', maxWidth: cellW - 10, align: 'center', compact: true });
        label.position.set(cx + Math.round((cellW - label.width) / 2), cy + 31);
        body.addChild(label);
        if (e.seen && e.count > 0) {
          const c = new PixelText(t('meta.bestiarioDerrotados', { n: e.count }), { color: 'a', outline: 'k' });
          c.position.set(cx + cellW - c.width - 6, cy + 3);
          body.addChild(c);
        }
      });
    }

    // Footer: previous / page / next / close.
    const fy = h - BOTTOM + 4;
    const prev = new Button('<', 22, 16, () => {
      page = (page + pages - 1) % pages;
      draw();
    }, 'K', 'w');
    const next = new Button('>', 22, 16, () => {
      page = (page + 1) % pages;
      draw();
    }, 'K', 'w');
    const label = new PixelText(t('meta.pagina', { n: page + 1, total: pages }), { color: 'w', outline: 'k' });
    prev.position.set(10, fy);
    next.position.set(36, fy);
    label.position.set(64, fy + 5);
    const close = new Button(t('meta.cerrar'), 70, 16, onClose, 'a', 'k');
    close.position.set(w - 80, fy);
    prev.visible = next.visible = pages > 1;
    label.visible = pages > 1;
    body.addChild(prev, next, label, close);
  };

  draw();
  return root;
}
