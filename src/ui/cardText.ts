import { ARMAS } from '../data/armas.ts';
import { PICKUPS, RARITY } from '../data/balance.ts';
import { RASGOS } from '../data/rasgos.ts';
import { levelUp, type Offer } from '../game/build.ts';
import { t } from '../i18n/index.ts';

export interface CardText {
  title: string;
  /** "Nuevo" or "Nivel 2 → 3". */
  level: string;
  /** One line with the exact number. */
  effect: string;
  /** The small Chilean flavour text. */
  flavor: string;
  /** Icon animation name in the `icono` sprite. */
  icon: string;
}

export const LUCAS_CARD = 25;

const pct = (v: number): string => fmt(Math.round(v * 100));
/** Chilean number format with a decimal comma. */
const fmt = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));

/** Texts for a level-up card, with numbers already scaled by rarity. */
export function describe(offer: Offer): CardText {
  const mult = RARITY.find((r) => r.id === offer.rarity)?.mult ?? 1;
  if (offer.kind === 'heal') {
    return { title: t('ui.curar'), level: '', effect: t('ui.curarEfecto', { n: PICKUPS.moteConHuesillo.heal }), flavor: '', icon: 'laOnce' };
  }
  if (offer.kind === 'evolution') {
    return {
      title: t(`evoluciones.${offer.evolution}`),
      level: t('ui.evoluciona'),
      effect: t(`evolucionesEfecto.${offer.evolution}`),
      flavor: '',
      icon: offer.id,
    };
  }
  if (offer.kind === 'lucas') {
    return { title: t('ui.lucasCarta'), level: '', effect: t('ui.lucasEfecto', { n: LUCAS_CARD }), flavor: '', icon: 'choro' };
  }
  const level = offer.toLevel === 1 ? t('ui.nuevo') : t('ui.nivelDeA', { de: offer.toLevel - 1, a: offer.toLevel });

  if (offer.kind === 'weapon') {
    const def = ARMAS.find((a) => a.id === offer.id);
    if (!def) return { title: offer.id, level, effect: '', flavor: '', icon: 'guau' };
    const title = t(`${def.i18n}.nombre`);
    let effect: string;
    if (offer.toLevel === 1) {
      effect = t(`${def.i18n}.efecto`);
    } else if (def.id === 'guau') {
      effect = `${t('efectos.guauDamage', { n: 25 })}, ${t('efectos.guauCooldown', { n: '0,6' })}`;
    } else {
      const up = levelUp(def, offer.toLevel);
      const parts: string[] = [];
      if (up.count) parts.push(t('efectos.count', { n: up.count, unidad: t(`unidades.${def.id}`) }));
      if (up.bounces) parts.push(t('efectos.bounces', { n: up.bounces }));
      if (up.chains) parts.push(t('efectos.chains', { n: up.chains }));
      if (up.damageMult) parts.push(t('efectos.damage', { n: pct(up.damageMult) }));
      if (up.cooldownMult) parts.push(t('efectos.cooldown', { n: pct(up.cooldownMult) }));
      if (up.durationMult) parts.push(t('efectos.duration', { n: pct(up.durationMult) }));
      if (up.areaMult) parts.push(t('efectos.area', { n: pct(up.areaMult) }));
      effect = parts.join(', ');
    }
    if (mult > 1) effect += ` ${t('efectos.rarityBonus', { n: pct((mult - 1) * 0.2) })}`;
    return { title, level, effect, flavor: '', icon: def.id };
  }

  const def = RASGOS.find((r) => r.id === offer.id);
  if (!def) return { title: offer.id, level, effect: '', flavor: '', icon: 'olfato' };
  const p = def.perLevel;
  const parts: string[] = [];
  if (p.speedMult) parts.push(t('efectos.speedMult', { n: pct(p.speedMult * mult) }));
  if (p.armor) parts.push(t('efectos.armor', { n: Math.round(p.armor * mult) }));
  if (p.maxHp) parts.push(t('efectos.maxHp', { n: fmt(Math.round(p.maxHp * mult)) }));
  if (p.regen) parts.push(t('efectos.regen', { n: fmt(Math.round(p.regen * mult * 10) / 10) }));
  if (p.areaMult) parts.push(t('efectos.areaMult', { n: pct(p.areaMult * mult) }));
  if (p.damageMult) parts.push(t('efectos.damageMult', { n: pct(p.damageMult * mult) }));
  if (p.cooldownMult) parts.push(t('efectos.cooldownMult', { n: pct(p.cooldownMult * mult) }));
  if (p.pickupMult) parts.push(t('efectos.pickupMult', { n: pct(p.pickupMult * mult) }));
  if (p.projectilesAtLevels) {
    parts.push(
      p.projectilesAtLevels.includes(offer.toLevel) ? t('efectos.projectilesAhora') : t('efectos.projectiles'),
    );
  }
  return {
    title: t(`${def.i18n}.nombre`),
    level,
    effect: parts.join(', '),
    flavor: `"${t(`${def.i18n}.carta`)}"`,
    icon: def.id,
  };
}
