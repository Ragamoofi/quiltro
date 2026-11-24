/** Zones of Chile and their cities (GDD "Zonas y kilómetros"). */
export type ZoneId = 'norte' | 'centro' | 'sur' | 'patagonia' | 'antartica';

export interface ZoneDef {
  readonly id: ZoneId;
  /** i18n key under `zonas.` */
  readonly i18n: string;
  readonly startMin: number;
  /** Infinity for La Antártica. */
  readonly endMin: number;
  readonly hazard: string;
  readonly boss: string | null;
  readonly enemies: readonly string[];
  /** Colour for the Ruta del día squares. */
  readonly shareSquare: string;
}

export const TOTAL_KM = 4300;
export const RUN_MINUTES = 12;
/** 4300 / 12 ≈ 358 km per minute survived. */
export const KM_PER_MINUTE = TOTAL_KM / RUN_MINUTES;

export const ZONAS: readonly ZoneDef[] = [
  { id: 'norte', i18n: 'zonas.norte', startMin: 0, endMin: 3, hazard: 'remolinos', boss: 'alicanto', enemies: ['zancudo', 'jote', 'guanaco'], shareSquare: '🟨' },
  { id: 'centro', i18n: 'zonas.centro', startMin: 3, endMin: 6, hazard: 'microQueNoPara', boss: 'taco', enemies: ['paloma', 'micro', 'gaviota', 'loboMarino'], shareSquare: '🟦' },
  { id: 'sur', i18n: 'zonas.sur', startMin: 6, endMin: 9, hazard: 'neblina', boss: 'caleuche', enemies: ['chonchon', 'camahueto', 'basilisco'], shareSquare: '🟩' },
  { id: 'patagonia', i18n: 'zonas.patagonia', startMin: 9, endMin: 12, hazard: 'viento', boss: 'granTemblor', enemies: ['tempano', 'chingue'], shareSquare: '⬜' },
  { id: 'antartica', i18n: 'zonas.antartica', startMin: 12, endMin: Number.POSITIVE_INFINITY, hazard: 'rotativo', boss: null, enemies: [], shareSquare: '⬜' },
];

/**
 * Cities shown under the km counter, in game km (scaled so that Punta Arenas is
 * 4.300 km at minute 12). Valparaíso triggers the mid-Centro banner; Chiloé is an
 * unlock condition (El Pudú) and a Ruta del día milestone.
 */
export interface CityDef {
  readonly id: string;
  /** i18n key under `ciudades.` */
  readonly i18n: string;
  readonly km: number;
  /** Shown in the HUD list from the GDD (Valparaíso and Chiloé are extra milestones). */
  readonly hud: boolean;
}

export const CIUDADES: readonly CityDef[] = [
  { id: 'arica', i18n: 'ciudades.arica', km: 0, hud: true },
  { id: 'antofagasta', i18n: 'ciudades.antofagasta', km: 540, hud: true },
  { id: 'santiago', i18n: 'ciudades.santiago', km: 1075, hud: true },
  { id: 'valparaiso', i18n: 'ciudades.valparaiso', km: 1610, hud: false },
  { id: 'temuco', i18n: 'ciudades.temuco', km: 2150, hud: true },
  { id: 'puertoMontt', i18n: 'ciudades.puertoMontt', km: 2600, hud: true },
  { id: 'chiloe', i18n: 'ciudades.chiloe', km: 2900, hud: false },
  { id: 'coyhaique', i18n: 'ciudades.coyhaique', km: 3225, hud: true },
  { id: 'puntaArenas', i18n: 'ciudades.puntaArenas', km: 4300, hud: true },
  { id: 'antartica', i18n: 'ciudades.antartica', km: 4301, hud: false },
];
