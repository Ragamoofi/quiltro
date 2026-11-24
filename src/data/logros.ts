/** Achievements (GDD "Logros"). Each gives lucas and a bandana colour. */
export interface AchievementDef {
  readonly id: string;
  /** i18n keys under `logros.<id>` (nombre, desc). */
  readonly i18n: string;
  readonly lucas: number;
  /** Palette character for the bandana it unlocks. */
  readonly bandana: string;
  readonly secret: boolean;
}

export const LOGROS: readonly AchievementDef[] = [
  { id: 'niSeInmuto', i18n: 'logros.niSeInmuto', lucas: 100, bandana: 'r', secret: false },
  { id: 'laMicroSiParo', i18n: 'logros.laMicroSiParo', lucas: 100, bandana: 'y', secret: false },
  { id: 'dieciochero', i18n: 'logros.dieciochero', lucas: 150, bandana: 'w', secret: false },
  { id: 'deAricaAPuntaArenas', i18n: 'logros.deAricaAPuntaArenas', lucas: 500, bandana: 'a', secret: false },
  { id: 'puroAguante', i18n: 'logros.puroAguante', lucas: 200, bandana: 'f', secret: false },
  { id: 'paLaFoto', i18n: 'logros.paLaFoto', lucas: 150, bandana: 'p', secret: false },
  { id: 'guardianes', i18n: 'logros.guardianes', lucas: 300, bandana: 't', secret: true },
];
