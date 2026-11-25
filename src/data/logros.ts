/** Achievements (GDD "Logros"). Each gives lucas; a few also give a bandana colour. */
export interface AchievementDef {
  readonly id: string;
  /** i18n keys under `logros.<id>` (nombre, desc). */
  readonly i18n: string;
  readonly lucas: number;
  /** Palette character for the bandana it unlocks (null: none). */
  readonly bandana: string | null;
  readonly secret: boolean;
}

const logro = (id: string, lucas: number, bandana: string | null = null, secret = false): AchievementDef => ({
  id,
  i18n: `logros.${id}`,
  lucas,
  bandana,
  secret,
});

/**
 * The first seven are earned during a trip (the game announces them on the spot). The rest are
 * worked out when a trip ends, from the trip and from the whole save (see `meta/logros.ts`).
 */
export const LOGROS: readonly AchievementDef[] = [
  logro('niSeInmuto', 100, 'r'),
  logro('laMicroSiParo', 100, 'y'),
  logro('dieciochero', 150, 'w'),
  logro('deAricaAPuntaArenas', 500, 'a'),
  logro('puroAguante', 200, 'f'),
  logro('paLaFoto', 150, 'p'),
  logro('guardianes', 300, 't', true),
  // The road: reaching each city.
  logro('antofagasta', 60),
  logro('capitalino', 80),
  logro('cerroArriba', 100),
  logro('vinaDelMar', 100),
  logro('araucano', 120),
  logro('chilote', 150),
  logro('patagonico', 200),
  logro('antartico', 300, 'i'),
  // The bosses.
  logro('matapajaros', 100),
  logro('tacoTaco', 150),
  logro('barcoFantasma', 200),
  logro('cazajefes', 300, 'o'),
  // Numbers.
  logro('milYUna', 80),
  logro('plagaDePlagas', 200),
  logro('barrida', 150),
  logro('matanza', 300),
  logro('sopaipillero', 200),
  logro('nivel20', 80),
  logro('nivel40', 200),
  logro('diezMinutos', 150),
  logro('maraton', 300),
  // Keeping at it.
  logro('diezViajes', 100),
  logro('cincuentaViajes', 300),
  logro('manada', 150),
  logro('todaLaJauria', 400, 'v'),
  logro('disfrazado', 250),
  // Weapons and evolutions.
  logro('primeraEvolucion', 100),
  logro('coleccionista', 200),
  logro('todasEvoluciones', 500),
  logro('armeria', 200),
  // La Cucha and the neighbours.
  logro('casaPropia', 80),
  logro('cuchaDeLujo', 300),
  logro('buenVecino', 100),
  // Skill.
  logro('deHoy', 100),
  logro('nadaMeToca', 400),
  // Secrets.
  logro('malDePalomas', 150, null, true),
  logro('pacifista', 250, null, true),
];
