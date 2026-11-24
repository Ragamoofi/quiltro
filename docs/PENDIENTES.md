# Pendientes para revisar

## Curva de experiencia (revisada en Fase 3)

Con los enemigos de todas las zonas, un bot que junta comida y elige cartas al azar llega a nivel ~36 al minuto 12 y ~50 al vencer al Gran Temblor. Está cerca de las ~40 subidas del GDD; no se tocó la fórmula.

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
