# Pendientes para revisar

## Ladrido real CC0 (Fase 6)

El GDD pide un ladrido real de dominio público (CC0) para el ¡GUAU!. Hoy es un ladrido sintetizado (dos formantes con eco corto) que funciona y se mide bien, pero no suena a perro de verdad. Para cambiarlo hay que descargar un archivo de una fuente CC0 (Freesound u OpenGameArt, filtrando por CC0), recortarlo y registrarlo en `public/LICENSES.md`. **Necesita tu aprobación**: antes de descargar te diría el nombre del archivo, la fuente y el peso. El resto de la música y los efectos son 100 % sintetizados, sin archivos ni licencias que registrar.

## Mezcla: falta un oído humano (Fase 6 → Fase 8)

Todo el audio se verificó con un analizador de salida (cada efecto y cada zona producen señal; las capas, el jefe, el agachado de 30 % y el filtro de la pausa cambian el nivel como corresponde), pero no puedo escuchar. Hay que jugar con audífonos y ajustar a oído: el balance música contra efectos (`MUSIC_LEVEL` en `src/audio/music.ts`), si los golpes del volantín se pierden con 300 enemigos y si alguna melodía cansa a los 10 minutos.

## Curva de experiencia (revisada en Fase 3)

Con los enemigos de todas las zonas, un bot que junta comida y elige cartas al azar llega a nivel ~36 al minuto 12 y ~50 al vencer al Gran Temblor. Está cerca de las ~40 subidas del GDD; no se tocó la fórmula.

## Curva de dificultad con meta (Fase 4, simulación de 10 viajes)

Bot que esquiva, junta comida y objetos, elige cartas con criterio y compra mejoras (prioridad daño > vida > velocidad...). Con `LUCAS_SCALE = 2`:

| Viaje | Murió en | Nivel | Jefes |
| --- | --- | --- | --- |
| 1–4 | min 3,3–5,2 (Norte/Centro) | 7–12 | 0–1 |
| 5 | min 18,9, peleando con el Gran Temblor (4.300 km) | 62 | 3 |
| 6–10 | min 4,2–5,1 (Centro) | 12–16 | 1 |

Ganó 4.520 lucas y compró 30 niveles. **Se cumple el objetivo** (llega al jefe final dentro de 10 viajes), pero con mucha varianza: el Centro (micros, lobos, camahuetos en carga y proyectiles) es una muralla para un jugador débil, y el Gran Temblor tardó ~7 min. Revisar con jugadores reales en la Fase 8: posible bajar el pico del Centro o subir el efecto de Plato lleno / Frazada.

## Duración de las peleas con jefes (Fase 3 → Fase 8)

Con el bot (cartas al azar) las peleas duraron ~65 s (Alicanto, Taco), ~130 s (Caleuche) y ~270 s (Gran Temblor) antes de bajar la vida de los jefes y acercar al Caleuche. Hay que medirlo con jugadores reales en la Fase 8: la meta razonable es 45–90 s por jefe con un build decente.

Cosas que funcionan pero que hay que volver a mirar antes del lanzamiento (Fase 8).

## El ataque del volantín no convence del todo (Fase 1, 2026-11-24)

Al probarla, la Fase 1 se siente bien, pero el ataque del volantín todavía no convence. Se mantiene como está y se revisa al final. Ideas concretas para probar entonces, de la más chica a la más grande:

1. **Más peso en cada corte:** un destello del hilo al cortar, un "tirón" de 1 px del volantín hacia atrás y un sonido de papel más seco. No cambia la mecánica.
2. **Volantín que se inclina en 8 direcciones** según el giro (como pide el GDD), con estela más larga y de colores. Se lee mejor qué está atacando.
3. **Picada:** los volantines orbitan, pero cada ~1 s uno se lanza en picada al enemigo más cercano y vuelve tirando el hilo. Da sensación de que "atacan solos" con intención.
4. **Comisión (cortar hilos):** el daño lo hace el hilo curado (la línea completa) además del volantín, como en las peleas de volantines. Dar hilo pasa a ser barrer una zona grande.
5. **Menos volantines, más grandes:** 2 volantines de 16×16 con más daño. Más legible en el caos.

## Fase 7

- **npm audit:** 4 avisos moderados solo en herramientas de compilación (glob/minimatch dentro de workbox-build, de vite-plugin-pwa). 
pm audit --omit=dev da 0. No llegan al juego publicado.
- **Canva:** el arte promocional está hecho con el propio juego; si se quiere una versión más pulida o con otro estilo, se puede rehacer en Canva (pedirlo en el chat).
- **Ruta del día:** no se puede verificar en dos dispositivos reales desde aquí; se verificó con pruebas (misma semilla = mismo texto y mismas partidas). Falta probar en dos teléfonos.
- **Sin conexión:** el panel del navegador integrado no expone CacheStorage; probar a mano en Chrome (instalar y desconectar).

## Resolución en PC 1920x1080 (pedido del 2026-11-25)

El juego no se ve bien en una pantalla de 1920x1080 en PC (se ve raro). No se ha probado en celular. Hay que reproducirlo a 1920x1080, 1366x768 y 2560x1440, revisar src/core/display.ts (escala entera de 480x270), los bordes, la nitidez y el HUD, y recién ahí corregir. Se hace después de la Fase 10.
