/**
 * Fase 11.6 — Pasajes: after beating the final boss the same trip can be made harder, for more
 * lucas. Each pasaje opens when the one before it is won. La Antártica stays the endless mode.
 */
export interface PasajeDef {
  readonly id: 'normal' | 'horaPunta' | 'ultimoBus';
  /** i18n keys under `pasajes.<id>` (nombre, desc). */
  readonly i18n: string;
  /** Multipliers on enemy life, enemy damage, enemies per second and the lucas the trip pays. */
  readonly hp: number;
  readonly damage: number;
  readonly spawn: number;
  readonly lucas: number;
}

export const PASAJES: readonly PasajeDef[] = [
  { id: 'normal', i18n: 'pasajes.normal', hp: 1, damage: 1, spawn: 1, lucas: 1 },
  { id: 'horaPunta', i18n: 'pasajes.horaPunta', hp: 1.3, damage: 1.2, spawn: 1.25, lucas: 1.6 },
  { id: 'ultimoBus', i18n: 'pasajes.ultimoBus', hp: 1.7, damage: 1.4, spawn: 1.5, lucas: 2.5 },
];

export const NORMAL_PASAJE = PASAJES[0] as PasajeDef;

/** The pasaje at an index, clamped to the ones that exist. */
export function pasajeAt(index: number): PasajeDef {
  return PASAJES[Math.max(0, Math.min(PASAJES.length - 1, Math.floor(index)))] ?? NORMAL_PASAJE;
}

/** How many pasajes can be chosen when `won` of them have been cleared (the next one opens). */
export function pasajesOpen(won: number): number {
  return Math.min(PASAJES.length, Math.max(0, Math.floor(won)) + 1);
}
