# Balance: línea base y cómo medir

Medición de la Fase 9.0, hecha **antes de cambiar nada** del juego. Sirve para comparar cada tanda de la Fase 9 contra estos números.

## Cómo repetirla

1. `npm run dev` y abrir `http://localhost:5173/?debug`.
2. En la consola del navegador: `__quiltroBot.start('medio', 20, 7000)` (habilidad, cantidad de viajes, semilla inicial). Corre en segundo plano, a ~5 ms por segundo de juego, sin dibujar y sin tocar tu guardado.
3. `__quiltroBot.status()` muestra el avance, `__quiltroBot.summary()` el resumen y `__quiltroBot.reports()` el detalle por viaje.
4. Habilidades: `novato`, `medio`, `experto` (ver `src/debug/bot.ts`). La misma semilla da el mismo viaje.

## Qué hace cada bot

| | Novato | Medio | Experto |
| --- | --- | --- | --- |
| Reacción | 0,45 s | 0,2 s | 0,08 s |
| Va por comida a | 30 px | 110 px | 190 px |
| Se mueve al azar | 25 % de las veces | 6 % | nunca |
| Respeta avisos rojos de ataque | no | 60 % | 100 % |
| Usa ¡GUAU! | nunca | con 6+ enemigos cerca | con 4+ |
| Cartas | al azar | por puntaje (evolución > arma > rasgo con pareja) | igual, más un plan de 3 armas y repite la tirada si no sirve |

Todos esquivan enemigos y proyectiles escogiendo entre 16 direcciones. Juegan con el Quiltro base, sin mejoras de La Cucha.

## Resultado: 20 viajes por nivel (semillas 7000–7019)

| | Novato | Medio | Experto |
| --- | --- | --- | --- |
| Llegan al Centro (min 3) | 10 % | 90 % | 100 % |
| Llegan al Sur (min 6) | 0 % | 20 % | 25 % |
| Llegan a Patagonia (min 9) | 0 % | 15 % | 20 % |
| Vencen al Gran Temblor | 0 % | 0 % | 0 % |
| Minuto promedio de muerte | 2,0 | 5,5 | 6,2 |
| Nivel promedio | 4 | 14 | 14 |
| Máx. de enemigos a la vez | 132 | 157 | 292 |

**Muertes por zona (donde estaba al morir):** novato 20/20 en el Norte; medio 13 Norte, 4 Centro, 3 Patagonia; experto 13 Norte, 3 Centro, 1 Sur, 3 Patagonia.

**Causa de la muerte:**
- Novato: jote 10, proyectil (escupo) 7, zancudo 2, jefe 1.
- Medio: jefe 7, proyectil 5, micro 4, jote 1, chingue 1.
- Experto: jefe 8, proyectil 5, lobo marino 3, micro del camino 1, camahueto 1, témpano 1.

**Duración media de las peleas con jefe (incluye las que se pierden):**

| Jefe | Medio | Experto |
| --- | --- | --- |
| Alicanto | 46 s | 74 s |
| Taco | 34 s | 53 s |
| Caleuche | 74 s | 73 s |
| Gran Temblor | 115 s | 24 s (1 pelea) |

## Lo que dicen los números

1. **El Alicanto (primer jefe, min 3) es un muro para el bot.** Más de la mitad de los viajes medio y experto mueren ahí o justo antes, y ser más hábil casi no ayuda. Hay que mirar si el ataque del Alicanto es injusto para el bot o también para una persona.
2. **Disparidad enorme entre armas.** Daño por minuto, en viajes donde la arma estuvo equipada:

   | Arma | Medio | Experto |
   | --- | --- | --- |
   | Fuegos artificiales | 34.082 | 26.685 |
   | Trompo | 8.590 | 12.213 |
   | Rayuela | 9.299 | 2.026 |
   | Cables | 1.039 | 8.467 |
   | Chaya | 1.494 | 2.991 |
   | **Volantín** | **1.596** | **1.704** |
   | ¡GUAU! | 736 | 1.646 |

   Los fuegos pegan unas 20 veces más que el volantín, el arma inicial y la emblemática. Es coherente con tu sensación de que el volantín no convence: además de verse flojo, **pega poco**. Los números varían entre medio y experto porque pocas partidas llegan a tener cada arma (5 a 9), así que los uso como orden de magnitud y no como valor exacto.
3. **Pasivas:** las tasas de elección del bot reflejan su propia tabla de prioridades, así que no dicen qué prefieren las personas. Sí confirman que hoy hay rasgos que casi nunca valen la pena para él (Olfato, Chalequito).
4. **Rendimiento:** con hasta 292 enemigos, ~5 ms de CPU por segundo de juego (la simulación sola, sin dibujar).
5. **El novato no se parece a una persona que recién empieza.** Muere a los 2 minutos, sobre todo por los jotes y los escupos. Sirve de piso, no de meta.

## Después de la 9.2 (rarezas con efecto, pilares, volantín 8→12 y +40 %, fuegos 20→14)

Mismas semillas (7000–7019), 20 viajes por nivel.

| | Medio antes | Medio ahora | Experto antes | Experto ahora |
| --- | --- | --- | --- | --- |
| Minuto promedio de muerte | 5,5 | 5,6 | 6,2 | **8,1** |
| Nivel promedio | 13,9 | 13,7 | 14,2 | **22,6** |
| Llegan al Sur (min 6) | 20 % | 15 % | 25 % | **40 %** |
| Llegan a Patagonia (min 9) | 15 % | 15 % | 20 % | **35 %** |
| Mueren en el Norte (Alicanto) | 13/20 | 16/20 | 13/20 | 10/20 |

Daño por minuto del volantín: medio 1.596 → 2.349, experto 1.704 → 5.031. Fuegos: medio 34.082 → 32.167, experto 26.685 → 37.455.

**Lectura honesta:**
- El experto mejora claramente (llega más lejos y sube más de nivel); el medio no se mueve. Con 20 viajes, la diferencia entre antes y después del medio está dentro del ruido.
- **El Alicanto sigue siendo el muro del Norte** (10 a 16 de 20 muertes ahí). Ni las rarezas ni los pilares lo tocan: hay que mirar el jefe mismo.
- **La disparidad de armas sigue**: los fuegos todavía hacen 6 a 15 veces el daño del volantín. Medirla con partidas completas mezcla demasiadas cosas (qué cartas salieron, cuánto se vivió). Falta un **banco de armas** (arena controlada, mismos enemigos, mismo nivel) para ajustar arma por arma con datos limpios.

## 9.2b — Banco de armas y Alicanto

### Banco de armas (`__quiltroBot.bench([...armas], [niveles], [densidades], segundos)`)
Arena controlada: el quiltro quieto e invencible, solo con esa arma (cartas comunes) y `densidad` micros (60 de vida) a su alrededor, durante 30 s. Daño por segundo del arma sola:

| Arma, nivel 5 | 8 enemigos | 30 | 100 | 250 |
| --- | --- | --- | --- | --- |
| Volantín | 22 | 59 | 101 | 142 |
| Trompo | 53 | 43 | 62 | 30 |
| Cables | 21 | 45 | 95 | 101 |
| Chaya | 9 | 31 | 116 | 70 |
| Fuegos | 41 | 44 | 118 | 232 |
| Rayuela | 24 | 30 | 80 | 136 |

**Lectura:** con las mismas condiciones el volantín no es el arma más débil (es de las más altas hasta 100 enemigos). La gran diferencia que se veía en los viajes completos (fuegos 6 a 15 veces más) viene de que los fuegos son daño en área y se disparan con multitudes de 150 a 300 enemigos, y que en una partida cuentan muchas más cosas (qué cartas salieron, evoluciones, cuánto se vivió). Los cohetes a 250 enemigos hacen ~1,6 veces el daño del siguiente. Es un resultado razonable: un arma de área debe ganar en multitudes y una de un solo golpe, en duelos.
**Pendientes que sale del banco:** el trompo no escala bien con el nivel (53 → 30 a 250 enemigos, cuando debería subir) y los números varían mucho entre ejecuciones de 30 s. Hay que investigarlo en la 9.5 y repetir cada punto con varias semillas.

### Alicanto
Causa: más de la mitad del daño de los viajes que mueren en el Norte venía del **cuerpo del jefe**. Su picada seguía al quiltro sin ningún aviso y el contacto dolía 14. Cambios (`bosses/alicanto.ts`):
- La picada ahora **se anuncia**: un círculo rojo que se llena durante 1,15 s en el lugar donde estaba el quiltro, y el pájaro se compromete a ese punto (antes seguía al quiltro). Moverse la esquiva.
- El golpe de la picada hace 14 de daño de área; el contacto con el cuerpo baja de 14 a 8; las plumas de 8 a 6.

| Viajes de 20 | Antes | Después |
| --- | --- | --- |
| Medio: mueren en el Norte | 16 | **7** |
| Medio: minuto promedio de muerte | 5,6 | **9,1** |
| Medio: llegan al Sur / a Patagonia | 15 % / 15 % | **50 % / 45 %** |
| Experto: mueren en el Norte | 10 | **7** |
| Experto: llegan al Sur / a Patagonia | 40 % / 35 % | **55 % / 25 %** |

El objetivo era menos de 25 % de muertes en el Norte (5 de 20); queda en 35 %. Mejor, pero no cumplido del todo.
**Nuevo muro: el Centro.** Mueren ahí 6 a 8 de 20 (micros del camino y lobos marinos), y el Taco dura 131 s con el bot medio (meta 45 a 90 s). Es el siguiente a atacar. Nadie vence al jefe final todavía.

## Límites de esta medición

- El bot esquiva por puntaje, no ve patrones de ataque ni usa "dar hilo". Una persona buena lo hace mejor y una persona distraída peor. **Necesito que juegues 3 viajes** y me cuentes en qué minuto moriste y de qué, para saber a qué nivel de bot se parece cada quien y calibrar las metas de la Fase 9.
- Veinte viajes por nivel dan una idea de la forma, no cifras precisas (±15 puntos porcentuales).
- El experto y el medio salen parecidos porque ambos chocan con el mismo muro, el Alicanto.

## Metas para el resto de la Fase 9 (a recalibrar con tus partidas)

Se mantienen las del plan (`docs/PLAN-FASE9.md`, sección 3) con estos ajustes por lo medido:

- Volantín y ¡GUAU! deben quedar dentro de ±25 % del promedio de las demás armas; hoy el volantín está ~80 % por debajo.
- El Alicanto no debe matar a más del 25 % de los viajes medios.
- El primer objetivo concreto de la Fase 9.2 es reducir la disparidad entre armas.
