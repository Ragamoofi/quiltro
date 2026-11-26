import { Container, Graphics, Sprite } from 'pixi.js';
import { anim } from '../art/assets.ts';
import type { Build } from '../game/build.ts';
import { PILARES, PILLAR_POINTS, pillarTier } from '../data/pilares.ts';
import { PLAYER_BASE } from '../data/personajes.ts';
import { formatNumber, t } from '../i18n/index.ts';
import { RELICS } from '../game/systems/fairChallenge.ts';
import { PixelText } from './text.ts';
import { evolutionGuideView } from './evolutionGuideView.ts';
import { Button, C, ditherOverlay, FocusList, panel } from './widgets.ts';

export interface PauseStats {
  seconds: number;
  km: number;
  kills: number;
  level: number;
  hp: number;
  maxHp: number;
  relics?: readonly number[];
}

/**
 * "Pausa pa'l tecito": the run behind a dither, the current build with every
 * weapon and trait and its level, the run's numbers, and Seguir, Opciones and
 * Pa' la casa (asks for confirmation).
 */
export class PauseView {
  readonly root = new Container();
  readonly focus = new FocusList();
  private confirming = false;

  get open(): boolean {
    return this.root.visible;
  }

  show(
    build: Build,
    viewW: number,
    viewH: number,
    onResume: () => void,
    onQuit: () => void,
    onOptions: () => void,
    stats: PauseStats,
  ): void {
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.root.visible = true;
    this.confirming = false;
    this.root.addChild(ditherOverlay(viewW, viewH));
    const pw = Math.min(viewW - 20, 430);
    const ph = Math.min(viewH - 10, 262);
    const x0 = Math.round((viewW - pw) / 2);
    const y0 = Math.round((viewH - ph) / 2);
    const g = new Graphics();
    panel(g, x0, y0, pw, ph, 'K', 'k', 'g', 'k');
    this.root.addChild(g);
    const title = new PixelText(t('ui.pausa'), { color: 'w', outline: 'k' }, 2);
    title.position.set(Math.round((viewW - title.width) / 2), y0 + 8);
    this.root.addChild(title);

    const time = `${Math.floor(stats.seconds / 60)}:${String(Math.floor(stats.seconds % 60)).padStart(2, '0')}`;
    const line = new PixelText(
      `${time}  ·  ${formatNumber(stats.km)} km  ·  ${t('ui.enemigos')} ${formatNumber(stats.kills)}  ·  ${t('ui.nivelCorto', { n: stats.level })}  ·  ${stats.hp}/${stats.maxHp}`,
      { color: 'G', outline: 'k', maxWidth: pw - 16, align: 'center' },
    );
    line.position.set(Math.round((viewW - line.width) / 2), y0 + 30);
    this.root.addChild(line);

    // Weapons row then traits row, each icon with its level as dots.
    const rows: { icon: string; level: number; max: number; evo: boolean }[][] = [
      build.weapons.map((w) => ({ icon: w.def.id, level: w.level, max: w.def.maxLevel, evo: build.evolved.has(w.def.id) })),
      build.traits.map((tr) => ({ icon: tr.def.id, level: tr.level, max: tr.def.maxLevel, evo: false })),
    ];
    const dots = new Graphics();
    rows.forEach((row, r) => {
      const y = y0 + 50 + r * 30;
      const total = row.length * 22;
      row.forEach((item, i) => {
        const x = Math.round((viewW - total) / 2) + i * 22;
        const s = new Sprite(anim('icono', item.icon).textures[0]);
        s.position.set(x, y);
        this.root.addChild(s);
        if (item.evo) dots.rect(x - 1, y - 1, 18, 18).stroke({ width: 1, color: C('a') });
        for (let d = 0; d < item.max; d++) dots.rect(x + 1 + d * 3, y + 18, 2, 2).fill(C(d < item.level ? 'a' : 'g'));
      });
    });
    this.root.addChild(dots);
    if (stats.relics?.length) {
      const names = stats.relics.flatMap(id => RELICS[id]?.name ?? []);
      const relics = new PixelText(names.join(' · '), { color: 'a', maxWidth: pw - 20, align: 'center' });
      relics.position.set(Math.round((viewW - relics.width) / 2), y0 + 99);
      this.root.addChild(relics);
    }

    // Two columns: the dog's numbers right now, and the pillars with their bonus.
    const colY = y0 + 112;
    const colW = Math.floor((pw - 30) / 2);
    const leftX = x0 + 10;
    const rightX = leftX + colW + 10;
    const head = (text: string, x: number): void => {
      const h = new PixelText(text, { color: 'a', outline: 'k' });
      h.position.set(x, colY);
      this.root.addChild(h);
    };
    head(t('pausa.stats'), leftX);
    head(t('pausa.pilares'), rightX);
    const st = build.stats();
    const pct = (v: number): string => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`;
    const statRows: [string, string][] = [
      [t('pausa.dano'), pct(st.damageMult - 1)],
      [t('pausa.critico'), `${Math.round(st.critChance * 100)}% x${(PLAYER_BASE.critMultiplier + st.critDamage).toFixed(1)}`],
      [t('pausa.area'), pct(st.areaMult - 1)],
      [t('pausa.espera'), pct(st.cooldownMult - 1)],
      [t('pausa.velocidad'), pct(st.speedMult - 1)],
      [t('pausa.armadura'), String(st.armor)],
      [t('pausa.regen'), `${(st.regen).toFixed(1)}/s`],
      [t('pausa.iman'), pct(st.pickupMult - 1)],
      [t('pausa.exp'), pct(st.xpMult - 1)],
      [t('pausa.proyectiles'), `+${st.projectiles}`],
    ];
    const rowH = Math.max(8, Math.min(10, Math.floor((ph - 152) / 5)));
    statRows.forEach(([label, value], i) => {
      const half = i % 2;
      const x = leftX + half * Math.floor(colW / 2);
      const y = colY + 12 + Math.floor(i / 2) * rowH;
      const l = new PixelText(label, { color: 'G', outline: 'k' });
      const v = new PixelText(value, { color: 'w', outline: 'k' });
      l.position.set(x, y);
      v.position.set(x + Math.floor(colW / 2) - v.width - 4, y);
      this.root.addChild(l, v);
    });
    const bars = new Graphics();
    PILARES.forEach((pillar, i) => {
      const pts = build.pillarPoints(pillar.id);
      const tier = pillarTier(pts);
      const y = colY + 12 + i * 12;
      const name = new PixelText(`${t(`${pillar.i18n}.nombre`)} ${pts}/${PILLAR_POINTS[1]}`, { color: tier > 0 ? pillar.color : 'G', outline: 'k' });
      name.position.set(rightX, y);
      this.root.addChild(name);
      // A bar to 7 points with a notch at 3 (first bonus).
      const bx = rightX + 62;
      const bw = 40;
      bars.rect(bx, y + 1, bw, 4).fill(C('k'));
      bars.rect(bx + 1, y + 2, Math.round((bw - 2) * Math.min(1, pts / PILLAR_POINTS[1])), 2).fill(C(pillar.color));
      bars.rect(bx + Math.round((bw * PILLAR_POINTS[0]) / PILLAR_POINTS[1]), y, 1, 6).fill(C('w'));
      const bonus = new PixelText(tier > 0 ? t(`${pillar.i18n}.bono${tier}`) : t('pausa.pilarNada', { n: PILLAR_POINTS[0] - pts }), { color: tier > 0 ? 'w' : 'g', outline: 'k', maxWidth: colW - 106, compact: true });
      bonus.position.set(bx + bw + 4, y);
      this.root.addChild(bonus);
    });
    this.root.addChild(bars);

    const bw = Math.floor((pw - 24 - 12) / 3);
    const by = y0 + ph - 30;
    const resume = new Button(t('ui.seguir'), bw, 20, onResume, 'v', 'w');
    const options = new Button(t('ui.opciones'), bw, 20, onOptions, 'K', 'w');
    const quit = new Button(t('ui.paLaCasa'), bw, 20, () => {
      if (this.confirming) {
        onQuit();
        return;
      }
      this.confirming = true;
      quit.setText(t('ui.confirmarSalir').split('.')[0] ?? '¿Seguro?');
    }, 'r', 'w');
    resume.position.set(x0 + 12, by);
    options.position.set(x0 + 18 + bw, by);
    quit.position.set(x0 + 24 + bw * 2, by);
    this.root.addChild(resume, options, quit);
    const guide = new Button(t('guiaEvoluciones.boton'), 36, 16, () => {
      const view = evolutionGuideView(build, viewW, viewH, this.focus, () => {
        view.destroy({ children: true });
        this.focus.set([resume, guide, options, quit]);
      });
      this.root.addChild(view);
    }, 'b', 'w');
    guide.position.set(x0 + pw - 44, y0 + 7);
    this.root.addChild(guide);
    this.focus.set([resume, guide, options, quit]);
  }

  hide(): void {
    this.root.visible = false;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
  }
}
