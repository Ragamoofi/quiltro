import { describe, expect, it } from 'vitest';
import { SPRITES } from '../src/art/sprites/index.ts';
import { chestPrice, CHEST_PRICE, EVENT_TIMING } from '../src/game/systems/roadEvents.ts';
import { hasKey } from '../src/i18n/index.ts';

describe('eventos del camino', () => {
  it('the chest is paid in sopaipillas from the counter: dearer with the level and with each chest opened', () => {
    expect(chestPrice(10, 0)).toBe(CHEST_PRICE.base + CHEST_PRICE.perLevel * 10);
    expect(chestPrice(10, 2)).toBeGreaterThan(chestPrice(10, 1));
    expect(chestPrice(10, 1)).toBeGreaterThan(chestPrice(10, 0));
    expect(chestPrice(1, 0)).toBeGreaterThanOrEqual(10);
    // A level-30 dog that already opened two chests pays a few hundred, not thousands.
    expect(chestPrice(30, 2)).toBeLessThan(300);
  });

  it('events come rarely: the first after 50 s, then every 70 to 100 s, and wait 45 s at most', () => {
    expect(EVENT_TIMING.first).toBeGreaterThanOrEqual(40);
    expect(EVENT_TIMING.between[0]).toBeGreaterThanOrEqual(60);
    expect(EVENT_TIMING.between[1]).toBeGreaterThan(EVENT_TIMING.between[0]);
    expect(EVENT_TIMING.stays).toBeLessThan(EVENT_TIMING.between[0]);
  });

  it('every text and sprite they need exists', () => {
    for (const key of [
      'eventos.cofre.nombre', 'eventos.cofre.aviso', 'eventos.cofre.precio', 'eventos.cofre.faltan', 'eventos.cofre.faltanSub', 'eventos.cofre.abierto',
      'eventos.animita.nombre', 'eventos.animita.aviso', 'eventos.animita.escudo', 'eventos.animita.viento', 'eventos.animita.abrigo', 'eventos.animita.fervor',
      'eventos.feriante.nombre', 'eventos.feriante.aviso', 'eventos.feriante.trato',
    ]) expect(hasKey(key), key).toBe(true);
    for (const name of ['cofre_ruta', 'animita', 'puesto_toldo']) expect(SPRITES.some((s) => s.name === name), name).toBe(true);
  });
});
