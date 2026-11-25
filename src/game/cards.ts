import { CAJA, PICKUPS } from '../data/balance.ts';
import { pillarOf, pillarTier } from '../data/pilares.ts';
import { t } from '../i18n/index.ts';
import { LUCAS_CARD, pillarLine } from '../ui/cardText.ts';
import type { Offer } from './build.ts';
import type { RunContext } from './context.ts';

/** Takes a card: heals, gives lucas or goes into the build. Returns the pillar that just woke up, if any. */
export function applyOffer(ctx: RunContext, offer: Offer): { title: string; text: string } | null {
  let woke: { title: string; text: string } | null = null;
  if (offer.kind === 'heal') ctx.player.heal(PICKUPS.moteConHuesillo.heal, ctx);
  else if (offer.kind === 'lucas') ctx.progress.lucas += LUCAS_CARD;
  else {
    const line = pillarLine(offer, ctx.build);
    ctx.build.apply(offer);
    if (line?.unlocks && offer.kind === 'trait') {
      const pillar = pillarOf(offer.id);
      const tier = pillar ? pillarTier(ctx.build.pillarPoints(pillar.id)) : 0;
      if (pillar && tier > 0) {
        woke = { title: t('efectos.pilarBono', { pilar: t(`${pillar.i18n}.nombre`) }), text: t(`${pillar.i18n}.bono${tier}`) };
      }
    }
  }
  ctx.refreshMods();
  return woke;
}

/** A card to put in place of a banished one (never one already on the table). */
export function replacementFor(ctx: RunContext, offers: readonly Offer[]): Offer {
  const taken = new Set(offers.map((o) => ('id' in o ? o.id : o.kind)));
  return (
    ctx.build
      .offers(ctx.rngCards, 6)
      .find((o) => !taken.has('id' in o ? o.id : o.kind)) ?? { kind: 'lucas', rarity: 'comun' }
  );
}

/** Rolls and applies what comes out of the Caja del Almacén. */
export function rollCaja(ctx: RunContext, golden: boolean): { rewards: Offer[]; evolution: ReturnType<RunContext['build']['evolutionReady']> } {
  const roll = ctx.rngCards.weighted(CAJA.rewards.map((r) => r.chance));
  let count: number = CAJA.rewards[roll]?.count ?? 1;
  if (golden) count = Math.max(3, count);
  const rewards: Offer[] = [];
  // An evolution, if one is ready, always comes out first.
  const evo = ctx.build.evolutionReady();
  if (evo) {
    const offer: Offer = { kind: 'evolution', id: evo.weapon, evolution: evo.id, rarity: 'legendaria' };
    ctx.build.apply(offer);
    rewards.push(offer);
    count = Math.max(1, count - 1);
  }
  for (let i = 0; i < count; i++) {
    const offer = ctx.build.offers(ctx.rngCards, 1)[0];
    if (!offer) break;
    ctx.build.apply(offer);
    rewards.push(offer);
  }
  ctx.refreshMods();
  return { rewards, evolution: evo };
}
