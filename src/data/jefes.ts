/** Bosses (GDD "Jefes"). Two phases each; phase 2 below 50 % HP. */
export interface BossDef {
  readonly id: string;
  /** i18n keys under `jefes.<id>` (nombre, linea). */
  readonly i18n: string;
  readonly zone: 'norte' | 'centro' | 'sur' | 'patagonia';
  readonly hp: number;
  readonly phase2At: number;
  /** Seconds of the intro (bar fill, big name, music change). */
  readonly introSeconds: number;
}

export const JEFES: readonly BossDef[] = [
  { id: 'alicanto', i18n: 'jefes.alicanto', zone: 'norte', hp: 1500, phase2At: 0.5, introSeconds: 2 },
  { id: 'taco', i18n: 'jefes.taco', zone: 'centro', hp: 3000, phase2At: 0.5, introSeconds: 2 },
  { id: 'caleuche', i18n: 'jefes.caleuche', zone: 'sur', hp: 8000, phase2At: 0.5, introSeconds: 2 },
  { id: 'granTemblor', i18n: 'jefes.granTemblor', zone: 'patagonia', hp: 15000, phase2At: 0.5, introSeconds: 2 },
];

/** La Antártica: previous bosses return upgraded every 3 minutes. */
export const ANTARTICA_BOSS_EVERY_MIN = 3;
