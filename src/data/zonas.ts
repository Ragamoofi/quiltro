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
  { id: 'centro', i18n: 'zonas.centro', startMin: 3, endMin: 6, hazard: 'microQueNoPara', boss: 'taco', enemies: ['paloma', 'micro', 'colectivo', 'rata', 'gaviota', 'loboMarino'], shareSquare: '🟦' },
  { id: 'sur', i18n: 'zonas.sur', startMin: 6, endMin: 9, hazard: 'neblina', boss: 'caleuche', enemies: ['chonchon', 'camahueto', 'basilisco', 'loboMarino'], shareSquare: '🟩' },
  { id: 'patagonia', i18n: 'zonas.patagonia', startMin: 9, endMin: 12, hazard: 'viento', boss: 'caiCai', enemies: ['tempano', 'chingue'], shareSquare: '⬜' },
  { id: 'antartica', i18n: 'zonas.antartica', startMin: 12, endMin: Number.POSITIVE_INFINITY, hazard: 'rotativo', boss: null, enemies: [], shareSquare: '⬜' },
];

/**
 * Cities shown under the km counter, in game km (scaled so that Punta Arenas is
 * 4.300 km at minute 12). Valparaíso triggers the mid-Centro banner; Chiloé is an
 * unlock condition (El Pudú) and a Ruta del día milestone.
 */
/**
 * Fase 10.4: inside a zone the enemies follow the place. Santiago has the city's own (traffic,
 * pigeons, rats); the coast of Valparaíso has the gulls and sea lions; the south splits in the
 * forest of the Araucanía and the sea of the lakes and Chiloé.
 */
export interface AmbienteDef {
  readonly id: string;
  readonly zone: ZoneId;
  readonly desdeKm: number;
  readonly hastaKm: number;
  readonly enemies: readonly string[];
  /** Floor (`suelo_<floor>`), horizon look and weather of the place. */
  readonly floor: string;
  readonly look: string;
  readonly weather: string;
}

export const AMBIENTES: readonly AmbienteDef[] = [
  { id: 'desierto', zone: 'norte', desdeKm: 0, hastaKm: 1075, enemies: ['zancudo', 'jote', 'guanaco'], floor: 'norte', look: 'norte', weather: 'norte' },
  { id: 'santiago', zone: 'centro', desdeKm: 1075, hastaKm: 1600, enemies: ['paloma', 'micro', 'colectivo', 'rata'], floor: 'santiago', look: 'santiago', weather: 'ciudad' },
  { id: 'costa', zone: 'centro', desdeKm: 1600, hastaKm: 2150, enemies: ['paloma', 'gaviota', 'loboMarino'], floor: 'costa', look: 'costa', weather: 'costa' },
  { id: 'araucania', zone: 'sur', desdeKm: 2150, hastaKm: 2700, enemies: ['chonchon', 'camahueto', 'basilisco'], floor: 'sur', look: 'sur', weather: 'sur' },
  { id: 'lagos', zone: 'sur', desdeKm: 2700, hastaKm: 3225, enemies: ['chonchon', 'camahueto', 'loboMarino'], floor: 'lagos', look: 'lagos', weather: 'lagos' },
  { id: 'patagonia', zone: 'patagonia', desdeKm: 3225, hastaKm: 4300, enemies: ['tempano', 'chingue'], floor: 'patagonia', look: 'patagonia', weather: 'patagonia' },
];

/** The environment of a zone at this kilometre (the last one of the zone if past its end). */
export function ambienteAt(zone: ZoneId, km: number): AmbienteDef | undefined {
  const list = AMBIENTES.filter((a) => a.zone === zone);
  return list.find((a) => km >= a.desdeKm && km < a.hastaKm) ?? list[list.length - 1];
}

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
  { id: 'vina', i18n: 'ciudades.vina', km: 1900, hud: false },
  { id: 'temuco', i18n: 'ciudades.temuco', km: 2150, hud: true },
  { id: 'puertoMontt', i18n: 'ciudades.puertoMontt', km: 2600, hud: true },
  { id: 'chiloe', i18n: 'ciudades.chiloe', km: 2900, hud: false },
  { id: 'coyhaique', i18n: 'ciudades.coyhaique', km: 3225, hud: true },
  { id: 'puntaArenas', i18n: 'ciudades.puntaArenas', km: 4300, hud: true },
  { id: 'antartica', i18n: 'ciudades.antartica', km: 4301, hud: false },
];
