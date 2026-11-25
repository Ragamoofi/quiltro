/**
 * Escenarios de ciudad: al pasar por cada ciudad cruza el horizonte su hito, el suelo se llena
 * con su decorado, sale un cartel y, una vez por viaje, pasa algo chico y bueno. Neutro en
 * balance: nada de esto es un jefe ni una oleada, solo ayuda o ambiente.
 */
export type CityEvent =
  /** Two mote con huesillo (heal) drop beside the dog. */
  | 'brisa'
  /** A shower of food (experience). */
  | 'lluvia'
  /** The dogs of the hills: four free barks around the dog. */
  | 'cerros'
  /** Three motes. */
  | 'curanto'
  /** A Caja del Almacén. */
  | 'pincoya'
  /** A free shield. */
  | 'escudo';

export interface CityScene {
  /** CIUDADES id. */
  readonly id: string;
  /** Sprite that crosses the horizon. */
  readonly landmark: string;
  /** Ground prop sprinkled around while the city is near. */
  readonly prop: string | null;
  readonly event: CityEvent | null;
}

export const ESCENARIOS: readonly CityScene[] = [
  { id: 'arica', landmark: 'hito_arica', prop: 'cactus', event: null },
  { id: 'antofagasta', landmark: 'hito_antofagasta', prop: 'salitrera', event: 'brisa' },
  { id: 'santiago', landmark: 'hito_santiago', prop: null, event: 'lluvia' },
  { id: 'valparaiso', landmark: 'hito_valparaiso', prop: 'casa_valpo', event: 'cerros' },
  { id: 'vina', landmark: 'hito_vina', prop: 'palmera', event: null },
  { id: 'temuco', landmark: 'hito_temuco', prop: 'araucaria', event: 'lluvia' },
  { id: 'puertoMontt', landmark: 'hito_puertoMontt', prop: null, event: 'curanto' },
  { id: 'chiloe', landmark: 'hito_chiloe', prop: 'iglesia', event: 'pincoya' },
  { id: 'coyhaique', landmark: 'hito_coyhaique', prop: null, event: 'escudo' },
  { id: 'puntaArenas', landmark: 'hito_puntaArenas', prop: 'cerco', event: null },
];

/** Kilometres before and after the city during which its scenery is on screen. */
export const CIUDAD_VENTANA = { antes: 110, despues: 140 } as const;
/** The cartel and the event fire this many km before the city. */
export const CIUDAD_AVISO_KM = 40;
