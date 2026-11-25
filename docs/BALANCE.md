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

## 9.2c — El muro del Centro

**Dónde se perdía:** en los viajes que morían en el Centro, el daño recibido venía de los micros (~1.700 en 8 viajes del experto) y los lobos marinos (~1.450), dos tercios del total. Además, con el bot medio el Taco duró 391 y 573 s en dos viajes (nunca lo derrotó): sus 4.600 de vida más 12 cuerpos que dañan por contacto.

**Cambios** (`data/enemigos.ts`, `data/jefes.ts`, `bosses/taco.ts`):
- Micro: daño 18 → 14.
- Lobo marino: daño 20 → 15 y vida 140 → 110.
- Taco: vida 4.000 → 3.000 y contacto de cada cuerpo 16 → 12.

| 20 viajes | Medio antes | Medio ahora | Experto antes | Experto ahora |
| --- | --- | --- | --- | --- |
| Mueren en el Centro | 6 | **3** | 8 | **4** |
| Llegan al Sur (min 6) | 50 % | 55 % | 55 % | **70 %** |
| Llegan a Patagonia (min 9) | 45 % | 55 % | 25 % | **55 %** |
| Minuto promedio de muerte | 9,1 | 9,6 | 8,0 | **10,4** |
| Taco: duración media | 131 s | 123 s | 28 s | 34 s |

Meta cumplida en el Centro (≤ 20 % de muertes). **El Taco con el bot medio sigue lento** (123 s promedio, con peleas de más de 300 s): el bot medio le pega poco. Con una persona que apunta, el tiempo debería parecerse más al del experto, pero es algo que hay que mirar jugando.
**Dónde se pierde ahora:** Patagonia (4 a 9 de 20 muertes, por el Gran Temblor y los témpanos) y el Norte (5 a 8, Alicanto). Nadie vence todavía al jefe final. El Gran Temblor se reemplaza en la 9.4b, así que lo reviso entonces con el jefe nuevo.

## 9.4b — El Vecino Viral (jefe final nuevo)

Reemplaza al Gran Temblor: un vecino original (nadie real) con megáfono y celular. HP base 9.000 (≈ 13.500 a los 10,5 minutos), tres hitboxes con contacto de 7. Fase 1 ("en vivo"): un cono rojo del megáfono (0,9 s de aviso) con un abanico de gritos, y una ráfaga de celulares lanzados. Fase 2 ("se hizo viral"): cada 7 s llegan 6 zancudos como seguidores y cada 8 s embiste tras una línea de aviso de 0,8 s y termina con un golpe de área.

**Bot v2:** para medir el jefe final tuve que arreglar al bot: no esquivaba las nubes del chingue (era la mayor fuente de daño en Patagonia, ~530 por viaje) y huía de los jefes en vez de acercarse, de modo que sus armas no los tocaban. Ahora esquiva las nubes y, contra un jefe, va hacia él si no hay comida cerca. **Las cifras de antes y después de este cambio de bot no se comparan entre sí**; esta es la línea base nueva (mismas semillas 7000–7019):

| 20 viajes | Medio | Experto |
| --- | --- | --- |
| Llegan al Sur / Patagonia | 50 % / 45 % | 45 % / 35 % |
| Vencen al Vecino Viral | **10 % (2 de 20)** | 0 % (4 peleas, todas perdidas) |
| Duración de las peleas con el jefe final | 33, 120, 101, **52 ganada**, **85 ganada** | 67, 96, 106, 42 (perdidas) |
| Minuto promedio de muerte | 8,8 | 8,6 |
| Mueren en el Norte / Centro / Patagonia | 9 / 1 / 7 | 9 / 4 / 7 |

**Lectura honesta:**
- Por primera vez el bot vence al jefe final, y las dos victorias duran 52 y 85 s, dentro de la meta de 45 a 90 s.
- La meta era 15–30 % de victorias con el bot medio y 40–60 % con el experto; estamos en 10 % y 0 %. Pocas partidas llegan al jefe (35 a 45 %), así que la muestra es muy chica (4 y 5 peleas). No toqué más el jefe para no ajustar sobre ruido.
- El Alicanto volvió a matar 9 de 20 porque el bot ahora se acerca a los jefes (como lo haría una persona): confirma que sigue siendo el primer escalón difícil y que conviene revisarlo con partidas humanas.
- El experto no gana al medio: el bot no distingue bien a los jefes por patrón. Con una persona real el resultado puede ser muy distinto.

## 9.4 — Ciudades como escenarios

Se midió con el mismo bot v2 y las mismas semillas (20 viajes) para ver que los eventos de ciudad no rompan nada ni muevan mucho el balance:

| | Medio antes | Medio ahora | Experto antes | Experto ahora |
| --- | --- | --- | --- | --- |
| Minuto promedio de muerte | 8,8 | 10,1 | 8,6 | 9,2 |
| Nivel promedio | 21,8 | 30,1 | 23,2 | 21,9 |
| Llegan al Sur / Patagonia | 50 % / 45 % | 55 % / 55 % | 45 % / 35 % | 55 % / 40 % |
| CPU por segundo de juego | 5,5 ms | 5,5 ms | 5,8 ms | 5,8 ms |
| Errores en consola | — | 0 | — | 0 |

Los cambios van en la dirección esperada (los eventos dan una ayuda chica: vida, experiencia, ladridos, una caja, un escudo), pero con 20 viajes están dentro del ruido (±15 puntos). La meta era "no mover las metas de supervivencia más de 5 puntos"; **no puedo confirmarlo ni refutarlo con esta muestra**. Rendimiento sin cambios.

## 9.5 — Cuatro armas y seis pasivas nuevas

**Armas** (todas con 5 niveles, evolución y rasgo pareja): Bolitas (ráfaga de canicas que rebotan), Emboque (bola con cuerda que va y vuelve), Elástico (banda que barre alrededor) y Ronda (anillos de colores que crecen desde el quiltro). **Pasivas:** Colmillo (crítico), Cola alegre (velocidad tras cada baja), Siesta (vida quieto), Hambre de lunes (experiencia), Cascabel (empuja a los enemigos chicos) y Manada chica (perritos aliados que muerden solos).

**Banco de armas** (nivel 5, daño por segundo, 100 enemigos): Ronda 104, Elástico 69, Emboque 65, Bolitas 29 (antes del ajuste de abajo), frente a Volantín 101, Cables 95, Chaya 116, Fuegos 118, Rayuela 80. Las armas nuevas caen en el mismo rango que las viejas.

**Lo que pasó al sumarlas (efecto de dilución):** con 10 armas en el mazo en vez de 6, el bot (y cualquiera) ve menos veces los fuegos y el trompo, que son con diferencia las que más daño hacen en las multitudes (en viajes completos, de 5 a 10 veces más que las demás). Con el contenido nuevo y sin ajustar nada:

| 20 viajes | Medio (antes) | Medio (con lo nuevo) | Experto (antes) | Experto (con lo nuevo) |
| --- | --- | --- | --- | --- |
| Minuto promedio de muerte | 10,1 | **6,5** | 9,2 | **7,4** |
| Llegan a Patagonia | 55 % | 25 % | 40 % | 30 % |

**Ajuste:** subí el daño base de las armas que no son de área (volantín 12→15, cables 15→18, chaya 4→5, rayuela 30→36, y las nuevas: bolitas 9→11, emboque 18→22, elástico 12→15, ronda 16→20). No toqué fuegos ni trompo.

| 20 viajes | Medio (final) | Experto (final) |
| --- | --- | --- |
| Minuto promedio de muerte | 8,0 | 8,3 |
| Llegan a Patagonia | 40 % | 35 % |
| **Vencen al Vecino Viral** | **25 % (5 de 20)** | 5 % (1 de 20) |
| CPU por segundo de juego | 5,1 ms | 5,7 ms |
| Errores en consola | 0 | 0 |

**Lectura honesta:** el medio queda dentro de la meta de victorias (15–30 %); el experto no (5 % contra 40–60 %), y no vence más que el medio, así que sigue pareciendo un límite del bot y no del juego. Llegar a Patagonia (40 % y 35 %) sigue por debajo del 50 % que quería. Hay que repetir esto con partidas humanas antes de tocar más.

## 10.3 — Equilibrio entre personajes

Bot medio, 12 viajes por personaje (semillas 7000–7011), con el mismo bot que juega al Quiltro. Meta del plan: minuto promedio de muerte entre 70 % y 130 % del del Quiltro. El Quiltro mismo varió entre 9,1 y 10,0 minutos entre mediciones (por el ruido y porque bajé la Ronda), así que los porcentajes tienen unos ±10 puntos.

| Personaje | Minuto de muerte | % del Quiltro (9,1) | Vencen al jefe final | Llegan a Patagonia |
| --- | --- | --- | --- | --- |
| Quiltro | 9,1 | 100 % | 17 % | 50 % |
| Quiltra | 11,9 | 130 % | 33 % | 67 % |
| Gato | 9,6 | 105 % | 33 % | 50 % |
| Zorro | 7,3 | 80 % | 25 % | 42 % |
| Pudú | 4,5 | **50 %** | 0 % | 17 % |
| Pingüino | 7,1 | 77 % | 25 % | 33 % |
| Chingue | 6,8 | 74 % | 25 % | 33 % |
| Cóndor | 8,1 | 88 % | 17 % | 42 % |
| Guanaco | 11,7 | 128 % | 17 % | 75 % |
| Paloma rebelde | 7,8 | 85 % | 25 % | 42 % |

**Ajustes hechos (tres rondas):**
- Quiltra: vida 125→100, la cura sale cada 40 enemigos (antes 25). **Ronda: daño 20→17** (era el arma de inicio más fuerte, y la elegía también cualquiera).
- Pudú: vida 65→105, esquiva 12→15 %, +30 % de daño.
- Pingüino: vida 100→115 y +1 armadura; deslizarse frena en 2,5 veces el tiempo normal (antes 4).
- Chingue: vida 90→100, aura 6→10 de daño por segundo y radio 30→34.
- Paloma rebelde: ya no pega 20 % menos; ahora +10 % de velocidad, +15 % de daño y 110 de vida.
- Zorro: vida 85→95.

**Un error real que apareció al medir:** el Chingue hacía fallar la pantalla final porque su aura se anotaba como fuente de daño sin ícono. Arreglado: ícono propio y, si una fuente no tiene ícono, se muestra la huella en vez de fallar. Hay una prueba que lo vigila.

**Lectura honesta:**
- Ocho de diez quedan entre 70 % y 130 %.
- **El Pudú sigue en 50 %** pese a tres subidas. Creo que es en buena parte culpa del bot: su Rayuela lanza el tejo hacia donde camina y el bot camina alejándose de los enemigos, así que casi no le pega a nadie. No lo subo más a ciegas: **necesito que alguien lo juegue** para decidir si hace falta.
- La Quiltra está en el borde (130 %). El Guanaco, que se mide más cerca de 117 % con otro Quiltro de referencia, también.
- Esto compara personajes entre sí con un bot; no dice si cada uno es divertido.

## 11.0 — Cai Cai Vilú (jefe final nuevo, reemplaza al Vecino Viral)

Bot medio, Quiltro, 20 viajes (semillas 7000–7019), 16 minutos máximo:

| Medida | Resultado |
| --- | --- |
| Vencen al jefe final | **10 % (2 de 20)** |
| Llegan a Patagonia | 30 % (6 de 20) |
| Minuto promedio de muerte | 6,4 |
| Duración de las peleas con Cai Cai Vilú | 25, 38 y 41 s (3 peleas medidas) |
| Muertes por zona | Norte 11, Centro 3, Sur 2, Patagonia 2 |

**Lectura:** el jefe final no es el muro: de los 6 viajes que llegan a Patagonia, solo 2 mueren ahí. Las peleas medidas duran 25–41 s, **por debajo de la meta de 45–120 s**, así que por ahora no lo subo: la muestra es de 3 peleas, el bot medio no juega bien los patrones y el muro real sigue siendo el Norte (11 de 20 muertes, el Alicanto). Se revisa con tus partidas; si te parece fácil, subo su vida (9.000 base) o acorto el tiempo entre ataques.

## 11.1 — El bot ahora es repetible

**Problema:** con la misma semilla el bot daba partidas distintas cada vez (la misma semilla dio 10,65 y 13,79 minutos). Causa: cuando el juego cambia la velocidad (cámara lenta al subir de nivel, al reiniciar escena) volvía a prender el bucle real, que metía pasos de simulación entre los del bot. Solución: `GameLoop.locked`; mientras el bot maneja la simulación el bucle real no avanza.

**Comprobación:** las mismas 6 semillas dos veces dan resultados idénticos (minuto, muertes y nivel de cada partida). La medición de 20 viajes (semillas 7000–7019, bot medio, Quiltro) da 10 % de victorias, 6,37 min, 1.992 km, 17,6 niveles y 2.527 enemigos, **exactamente igual** a la tomada antes de partir `runScene` y `main`: esa refactorización no cambió el juego.

**Qué significa para las cifras anteriores:** las mediciones de la Fase 9 y 10 se hicieron con este ruido (con la pestaña a la vista o no, el resultado podía cambiar mucho). Sus conclusiones generales sirven, pero las comparaciones finas entre personajes y armas hay que repetirlas. **Línea base nueva, repetible: bot medio, Quiltro, 20 viajes = 10 % de victorias, 6,37 min.**

## 11.3 — Eventos en el camino (nueva línea base)

Bot medio, Quiltro, 20 viajes (semillas 7000–7019): **15 % vencen al jefe final, minuto de muerte 7,25, 2.207 km, nivel 21, 35 % llega a Patagonia.** Antes de los eventos: 10 %, 6,37 min, 30 %. Los cofres, las animitas y el feriante ayudan un poco más de lo que cuestan; el bot los toma solo si pasa por encima. **Línea base vigente desde la 11.3.**

## Límites de esta medición

- El bot esquiva por puntaje, no ve patrones de ataque ni usa "dar hilo". Una persona buena lo hace mejor y una persona distraída peor. **Necesito que juegues 3 viajes** y me cuentes en qué minuto moriste y de qué, para saber a qué nivel de bot se parece cada quien y calibrar las metas de la Fase 9.
- Veinte viajes por nivel dan una idea de la forma, no cifras precisas (±15 puntos porcentuales).
- El experto y el medio salen parecidos porque ambos chocan con el mismo muro, el Alicanto.

## Metas para el resto de la Fase 9 (a recalibrar con tus partidas)

Se mantienen las del plan (`docs/PLAN-FASE9.md`, sección 3) con estos ajustes por lo medido:

- Volantín y ¡GUAU! deben quedar dentro de ±25 % del promedio de las demás armas; hoy el volantín está ~80 % por debajo.
- El Alicanto no debe matar a más del 25 % de los viajes medios.
- El primer objetivo concreto de la Fase 9.2 es reducir la disparidad entre armas.

## 11.4 a 11.7 — Guardianes, armas del barrio, pasajes y volantín (2026-11-25)

Bot medio, mismas semillas desde 7000. Línea base de la 11.3: 15 % de victorias, 7,25 min, 35 % llega a Patagonia.

| Cambio medido | Viajes | Victorias | Minuto prom. de muerte | Llegan a Patagonia |
| --- | --- | --- | --- | --- |
| + guardianes de zona (11.4) | 20 | 20 % | 7,58 | 35 % |
| + 5 armas y 6 pasivas, primera pasada (11.5) | 20 | 15 % | 8,76 | 45 % |
| + armas con números ajustados | 30 | 7 % | 9,07 | 50 % |
| + ajuste de Pandero, Cacerola y Boleadora, volantín con picada (11.7) | 16 | 19 % | 10,55 | 56 % |

**Guardianes (11.4):** un enemigo grande por zona, un minuto y medio después de entrar, con 8 veces la vida del normal, un pisotón con círculo rojo de 1 s cada 5 s y botín propio (caja dorada, lluvia de comida y 40 lucas). No movieron el equilibrio fuera del ruido.

**Armas nuevas (11.5), daño por minuto por viaje en que aparecen** (viaje completo con el bot medio; el banco de armas no sirve para compararlas porque se congela en la primera subida de nivel):

| Arma | Primera pasada | Segunda pasada | Comentario |
| --- | --- | --- | --- |
| Sopaipilla caliente | 22.170 | 11.828 | bajé el daño 8 → 6,5; ahora entre las armas medias |
| Choripán | 8.828 | 8.306 | sin cambios |
| Pandero | 1.262 | 2.869 | ahora apunta al enemigo más cercano y pega 20 → 40 |
| Boleadora | 1.790 | 2.420 | daño 9 → 26 |
| Cacerola | 396 | 1.956 | daño 18 → 52 y su golpe periódico sube a 80 %; es defensiva y la devuelve al recibir daño |

Aun así Pandero, Boleadora y Cacerola quedan por debajo del 70 % del promedio en daño bruto con el bot (2 a 5 viajes cada una, muestra chica). El bot no aprovecha que Cacerola devuelve golpes ni que el Pandero empuja. **Pendiente: que las juegues y me digas si se sienten flojas.** Nada se subió más a ciegas.

**Pasajes (11.6)**, bot medio, 16 viajes por pasaje:

| Pasaje | Vida × / daño × / aparición × / lucas × | Victorias | Minuto de muerte | Llegan a Patagonia |
| --- | --- | --- | --- | --- |
| Normal | 1 / 1 / 1 / 1 | 19 % | 10,6 | 56 % |
| Hora punta | 1,3 / 1,2 / 1,25 / 1,6 | 25 % | 9,4 | 50 % |
| Último bus | 1,7 / 1,4 / 1,5 / 2,5 | 0 % | 6,1 | 25 % |

El pasaje también escala la vida y la mano de los jefes. La curva de supervivencia baja como debe (10,6 → 9,4 → 6,1 min y 56 → 25 % en Patagonia) y el Último bus no lo gana nadie con el bot (meta: menos de 15 %). **La meta de que el experto gane el pasaje 1 entre 50 % y 70 % no se puede medir con este bot** (el experto casi no gana ni el normal, como ya decía el informe de la 10.2); queda para tus partidas. La diferencia de victorias entre Normal y Hora punta (19 % contra 25 %) está dentro del ruido de 16 viajes.

**Volantín (11.7):** la picada (un volantín se lanza al enemigo más cercano cada 1,1 s, con 60 % más de daño) y el peso al corte (destello blanco del hilo, tirón de 2 px hacia el perro y una pequeña sacudida) entraron sin mover el daño por minuto del volantín (6.361 antes, 7.964 después). **Hay que jugarlo para saber si por fin convence.**

## 11.14 — Los 26 personajes (2026-11-25)

Bot medio, 8 viajes por personaje (semillas 7000–7007), pasaje Normal. Meta: minuto promedio de muerte entre 70 % y 130 % del Quiltro (11,4 min → entre 8,0 y 14,9). Con 8 viajes el ruido es de ±1,5 min, así que solo se tocó a los que quedaron claramente bajo.

| Personaje | Min. (antes) | Gana | Llega a Patagonia |
| --- | --- | --- | --- |
| Quiltro | 11,4 | 25 % | 75 % |
| Ratonera | 13,8 | 50 % | 88 % |
| Gato | 8,8 | 38 % | 50 % |
| Zorro | 7,3 | 25 % | 38 % |
| Pudú | 7,5 | 25 % | 38 % |
| Pingüino | 7,8 | 38 % | 38 % |
| Chingue | 7,1 | 13 % | 38 % |
| Cóndor | 11,7 | 50 % | 88 % |
| Guanaco | 13,7 | 63 % | 100 % |
| Paloma | (se cortaba por un error, ver abajo) | | |
| Flamenco | 11,6 | 50 % | 75 % |
| Lobo marino | 12,9 | 75 % | 88 % |
| Puma | 7,0 | 38 % | 38 % |
| Monito | 8,8 | 25 % | 63 % |
| Chinchilla | 7,6 | 38 % | 38 % |
| Vizcacha | 8,5 | 50 % | 50 % |
| Huemul | 9,3 | 13 % | 50 % |
| Carpintero | 9,9 | 25 % | 63 % |
| Capibara | 11,3 | 25 % | 88 % |
| Llama | 6,2 | 25 % | 25 % |
| Tucán | 7,5 | 25 % | 38 % |
| Jaguar | 7,7 | 38 % | 38 % |
| Caleuchito | 9,7 | 25 % | 63 % |
| Perro del Dieciocho | 11,3 | 13 % | 88 % |
| Pillán | 9,3 | 25 % | 63 % |
| Trauquito | 10,7 | 38 % | 63 % |

**Ajustes:** más vida al Zorro (95 → 108), Pudú (105 → 118), Pingüino (115 → 128), Chingue (100 → 115, aura 10 → 12), Puma (85 → 100), Chinchilla (60 → 78), Tucán (85 → 100) y Jaguar (100 → 112). La Llama cambia la Rayuela por las Bolitas (escupe en abanico), 140 de vida y +20 % de daño: la Rayuela lanza hacia donde caminas y el bot camina alejándose de los enemigos, así que con ella casi no pegaba.

**Error encontrado al medir:** al terminar la historieta del final (después de vencer a Cai Cai Vilú) el juego intentaba dibujarla justo después de cerrarla y se caía. Le pasaba a cualquiera que ganara; con la Paloma, que gana seguido, salió primero. Arreglado.

**Después de los ajustes** (mismo bot, 8 viajes): Paloma 11,0 (ya no se cae), Zorro 9,6, Pudú 9,8, Pingüino 10,6, Puma 9,5, Chinchilla 8,1, Llama 13,3, Tucán 8,9, Jaguar 9,5 y Chingue 9,0. Al Chingue no le bastó la vida: su arma, el **Elástico**, era la más débil en todas las mediciones, así que se mejoró el arma (daño 15 → 22, alcance 70 → 80, descansa menos), lo que también ayuda al Jaguar. El Quiltro midió 13,0 en esta tanda. Ahora los 26 quedan entre 8,1 y 13,8 minutos, dentro de la meta de 70 % a 130 %.
