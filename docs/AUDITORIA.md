# Auditoría de QUILTRO (2026-11-25)

Qué hay hoy, qué dice el género y qué falta. Lo que no pude verificar lo marco como **sin verificar**.

## 1. Estado actual (medido en el código)

| Área | Hoy | Comentario |
| --- | --- | --- |
| Código | ~121 archivos TS, 15 archivos de pruebas, 128 pruebas, `npm run check` en verde, contraste 59/59 | Sin TODOs importantes en el código. |
| Archivos grandes | `runScene.ts` 945 líneas, `sfx.ts` 823, `enemies.ts` 758, `main.ts` 568, `bot.ts` 550, `cuchaScene.ts` 543 | `runScene` y `main` hacen demasiado; conviene partirlos antes de seguir sumando. |
| Armas / evoluciones | 11 armas, 11 evoluciones | Poco para un survivors: Vampire Survivors tiene más de 20 armas base. |
| Pasivas (rasgos) | 14 | Aceptable, pero muchas son solo números. |
| Enemigos | 17 + 4 jefes, enemigos propios por ambiente | Bien. Faltan élites y minijefes en medio de cada zona. |
| Personajes | 10, cada uno con arma y pasiva | Pudú sigue en ~50 % con el bot (puede ser culpa del bot). |
| Meta (La Cucha) | 20 mejoras + pilares de la Cucha | Bien, pero sin más sistemas que las compras. |
| **Logros** | **solo 7** (1 secreto) | Es el hueco más grande: en el género los logros desbloquean contenido y dan razones para volver. |
| Eventos en la partida | 1 (Temblor, una vez por run) | Megabonk vive de cofres, santuarios y eventos con riesgo. Aquí casi no hay. |
| Dificultad después de ganar | La Antártica (infinita) | No hay niveles de dificultad ni modificadores. |
| Ruta del día | Sí | Buen gancho; falta probarla en dos teléfonos. |
| Accesibilidad | daltonismo, reducir destellos, sacudida, números de daño, joystick fijo/flotante, mantener/alternar hilo | Sin verificar: remapeo de teclas y mando (gamepad). |
| Pantalla | 1080p arreglado (escala por medios pasos + tecla F) | Móvil **sin probar** en un dispositivo real. |
| Audio | 100 % sintetizado | **Nadie lo ha escuchado con oído humano**; el ladrido CC0 sigue pendiente (necesita tu aprobación para descargar). |
| Balance | Bot v2 (novato/medio/experto) | El bot no mide diversión; experto ≈ medio. **No hay ninguna partida humana medida.** Jefe nuevo (Cai Cai Vilú) sin medir con el bot. |
| PWA / sin conexión | 33 archivos precacheados (~1,6 MB) | Falta probarlo a mano en Chrome (instalar y desconectar). |
| Volantín | Pendiente (5 ideas en `PENDIENTES.md`) | Es el arma del personaje inicial: lo primero que ve cada jugador. |

## 2. Lo que dice el género (investigación)

Fuentes consultadas: análisis de Vampire Survivors ([The Secret Sauce of Vampire Survivors](https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors), [The Conversation](https://theconversation.com/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game-203613), [Epic Games](https://store.epicgames.com/news/vampire-survivors-built-genre-autoshooter-bullet-heaven)), reseñas de Megabonk ([PC Gamer](https://www.pcgamer.com/games/roguelike/megabonk-review), [Destructoid](https://www.destructoid.com/reviews/megabonk-review/)) y comentarios sobre Halls of Torment ([God is a Geek](https://www.godisageek.com/reviews/halls-of-torment-review), [Vaporlens](https://vaporlens.app/app/2218750/halls_of_torment)). La búsqueda no dio nada útil sobre Brotato ni Deep Rock Survivor, así que no los cito. Son opiniones de reseñistas, no datos de ventas.

Lo que se repite:

1. **Recompensa muy frecuente.** Un análisis de Vampire Survivors dice que cae un objeto cada ~23 segundos (frente a uno cada 2,5 minutos en juegos parecidos). Aun una partida perdida deja lucas, desbloqueos o aprendizaje.
2. **Partidas cortas y repetibles** (10–20 min por muerte) y estrategias distintas por partida: las sinergias hacen que elegir cartas sea más profundo de lo que parece.
3. **Cofres, santuarios y riesgo-recompensa (Megabonk).** Cofres que cuestan oro y suben de precio, santuarios gratis, santuarios de riesgo (más jefes, más dificultad por mejor botín) y desafíos con cofres de premio.
4. **Dificultad por niveles tras ganar.** Megabonk tiene tres niveles por mapa; Halls of Torment desbloquea "Agony Mode", que algunos sienten como el juego de verdad.
5. **Avisos del propio género:** (a) si la dificultad se puede inflar con demasiadas piezas, la rejugabilidad cae rápido y el equilibrio se rompe en las últimas etapas; (b) demasiadas monedas y grindeo de la meta cansan; (c) las misiones repetitivas matan la diversión; (d) los jugadores notan los juegos que son solo un "reskin".
6. **Cooperativo en pantalla compartida** se menciona como una oportunidad poco usada. Para QUILTRO es un extra grande: no lo propongo en esta fase.

Lo que QUILTRO ya hace bien y no hay que tocar: identidad chilena fuerte (ruta por km, ambientes, humor), ruta del día, rarezas y pilares, relanzar/saltar/descartar cartas, 10 personajes con identidad, accesibilidad básica, partidas de ~15 min con jefe final.

## 3. Brechas y qué hacer (por prioridad)

### Alta — el juego se siente corto después de 5–10 partidas
- **A1. Logros: de 7 a ~35** con recompensas útiles (bandanas, personajes, armas, mejoras de Cucha) y un **bestiario** que se llena al ver cada enemigo, jefe y arma.
- **A2. Eventos y cofres en el camino:** cofres con precio, **animitas** (santuario gratis con bendición), feriantes con trato riesgoso, "tentación" con riesgo-recompensa. Aprovechan la ruta por km y no necesitan mapas nuevos.
- **A3. Élites y minijefes** a mitad de cada zona (como los segadores de Vampire Survivors), con botín propio. Hoy entre jefe y jefe hay 3 minutos sin picos.
- **A4. Más contenido de build:** +5 armas (hasta 16), +6 pasivas con efecto de juego (no solo números) y sus evoluciones. Cada arma nueva se mide con el banco de armas del bot antes de publicarla.

### Media — rejugabilidad y claridad
- **M1. Dificultad tras ganar ("Pasajes"):** 3 niveles (Pasaje normal, "Hora punta", "Último bus"), cada uno con enemigos más duros y más lucas. Reemplaza lo que hoy es solo La Antártica; Antártica queda como modo infinito.
- **M2. Volantín**: elegir una de las 5 ideas de `PENDIENTES.md` (recomiendo la 3 "picada" + la 1 "más peso al corte") y probarla con ti.
- **M3. Legibilidad con 300 enemigos:** tope de enemigos visibles, contorno del jugador y de los disparos enemigos, prioridad de dibujo. Medir con el banco de rendimiento (`bench`).
- **M4. Estadísticas y registro de partidas:** pantalla con mejores marcas, personaje más usado, causa de muerte más común. Ayuda a que cada derrota enseñe algo.

### Baja — salud del proyecto
- **B1. Partir `runScene.ts` y `main.ts`** (eventos, HUD, debug y bot en módulos aparte) antes de agregar eventos.
- **B2. Probar en móvil real** (controles, rendimiento, instalación PWA, sin conexión) y en dos teléfonos para la ruta del día. Solo tú puedes hacerlo.
- **B3. Remapeo de teclas y mando** (sin verificar si existen; revisar `input.ts`).
- **B4. Oído humano** para la mezcla y decisión sobre el ladrido real CC0 (necesita tu OK antes de descargar nada).
- **B5. Medir a Cai Cai Vilú con el bot** (medio y experto, 20 viajes) y compararlo con el Caleuche; dejarlo en `BALANCE.md`.

## 4. Riesgos que veo
- Sumar eventos + armas + élites a la vez puede romper el equilibrio ya medido: se mide después de **cada** tanda, con las mismas semillas.
- El bot no juzga diversión. **Hasta que juegues 3 partidas, todos los números son hipótesis.**
- Los logros nuevos deben depender de cosas que de verdad pasan en el juego (se prueban con tests, como los desbloqueos actuales).
