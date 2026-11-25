# Plan de la Fase 11 — Más razones para volver

Sale de `docs/AUDITORIA.md`. Reglas de siempre: tandas chicas, un commit por tanda, `npm run check` verde antes de publicar, textos en `es-CL.json`, y **se mide con el bot (mismas semillas) antes y después** de cada tanda que toque el equilibrio. Nada se descarga sin tu OK.

Meta de la fase: que el juego aguante 20+ partidas sin repetirse, sin romper el equilibrio ya medido (personajes entre 70 % y 130 % del Quiltro, Centro y Alicanto sin muro extra).

## Tandas

### 11.0 — Cierre del jefe y orden de la casa (media jornada)
- Medir Cai Cai Vilú con el bot (medio y experto, 20 viajes, semillas 7000–7019) y anotar en `docs/BALANCE.md`. Ajustar vida/ataques solo si dura fuera de 45–120 s.
- Arreglar los textos viejos del "Vecino Viral" en el código y los planes vigentes (los informes históricos de `BALANCE.md` se dejan como estaban).
- **Listo cuando:** número del jefe documentado y `grep` de "Vecino Viral/Tío René" sin resultados en `src/`.

### 11.1 — Salud del código (1 jornada)
- Partir `runScene.ts` (945 líneas) y `main.ts`: sacar eventos de partida, depuración y bot a módulos propios, sin cambiar el comportamiento.
- **Hecho en la primera pasada:** el panel de depuración y los ganchos del bot salieron de `main.ts` (`src/debug/install.ts`); de `runScene.ts` salieron las cartas y la caja (`cards.ts`), el informe de fin de partida (`runReport.ts`) y el moai (`world/moai.ts`). `main.ts` pasó de 568 a ~360 líneas y `runScene.ts` de ~1.010 a ~835.
- **Falta:** sacar el flujo de menús de la partida (cartas, caja, pausa, final) a su propia clase; ahí `runScene.ts` bajaría a ~600.
- **Hallazgo y arreglo (hecho):** con la misma semilla el bot daba partidas distintas cada vez. No era el generador de números: era el bucle real, que se volvía a encender durante la cámara lenta y metía pasos de simulación entre los del bot. Ahora el bot lo bloquea (`GameLoop.locked`) y las mismas semillas dan partidas idénticas. Línea base nueva en `BALANCE.md`. Las cifras de personajes y armas de las fases 9 y 10 hay que repetirlas con el bot repetible (se hace junto con la 11.5).
- **Listo cuando:** ningún archivo de `src/game` pasa de ~600 líneas, 128 pruebas siguen verdes y la misma semilla da la misma partida.

### 11.1a — Pantalla completa y La Cucha (pedido del 2026-11-25, **prioridad alta**; 1 jornada)
Lo que se ve en las capturas del usuario (navegador de escritorio, ventana de ~1919×920):
- **Franjas oscuras alrededor del juego.** El juego mide 480×270 y se muestra a una escala entera (×3 = 1440×810), así que en una ventana de 1919×920 sobran bordes a los lados y arriba/abajo. Mi arreglo anterior (medios pasos y tecla F) no alcanza: con la barra del navegador la ventana no es 16:9.
- **La Cucha se ve mal:** la escena está pensada para 480×270 y en pantalla grande queda con el suelo y el cielo cortados, y los objetos apretados.
- **El Cóndor se mezcla con el chanchito de la Cuenta RUT** (el objeto `chanchito` de `data/cucha.ts` cae justo encima del personaje y no se distingue).

Plan:
1. Reproducir a 1919×920, 1920×1080 (pantalla completa), 1366×768 y 2560×1440, con capturas antes/después.
2. **Llenar la pantalla sin bordes**: el área de juego se adapta a la forma de la ventana (más ancho o más alto que 16:9) en vez de dejar franjas. Se ve más mundo a los lados, y el HUD y los menús se anclan a los bordes. Se mantiene la escala entera donde se pueda, y si no, escala fraccionaria con borde nítido. Opción en Opciones: "Pantalla: llenar / nítida".
3. **La Cucha**: recolocar objetos, personaje y chanchito sin que se pisen (posiciones fijas por objeto, personaje a un lado), y que el fondo cubra todo el ancho.
4. **Listo cuando:** en las cuatro resoluciones no hay franjas, nada se corta ni se pisa, y tú lo apruebas con tus propias capturas.

### 11.1b — Mapas vivos y fieles a su lugar (pedido del 2026-11-25; 3–4 jornadas, se hace por ambiente)
Pedido: que cada mapa se sienta como el lugar donde estamos, con más elementos propios y más vida. Se parte por el Norte y Valparaíso y después se recorre el resto, un ambiente por commit y con capturas antes/después.

- **Norte (desierto):** el sol se siente (luz cálida fuerte, brillo y vaho de calor en el horizonte, sombras largas, posible "insolación" suave si te quedas quieto al sol), **tornados / remolinos de polvo mucho mejor dibujados** (embudo con capas, polvo que se levanta, giro animado, aviso claro del peligro), más elementos del desierto: cactus, salares, geoglifos, ruinas de salitreras, esqueletos de animales, minas, camiones mineros lejanos, llamas y vicuñas, volcanes al fondo, cielo despejado con espejismos.
- **Valparaíso (todo lo icónico):** casas de colores en los cerros, escaleras y pasajes para "caminar entre los cerros", ascensores y funiculares, cables y postes, murales, gatos y perros de cerro, puerto con grúas y barcos, lobos marinos, la playa y el mar, gaviotas; y un tramo de **Viña del Mar** con el **reloj de flores**, palmeras y el borde costero.
- **Resto de los mapas** (Santiago, Centro, Temuco, Sur, Chiloé, Patagonia, Antártica): revisar cada uno con la misma pregunta "¿esto se ve y se siente como ahí?" y agregar al menos 6–8 elementos propios, vida ambiente (animales, gente, vehículos) y un clima o luz característicos. Santiago ya tiene la Estación Central; se suman cerro San Cristóbal, Costanera y metro. Sur: bosque de lluvia, araucarias, volcán Villarrica. Chiloé: palafitos, iglesias de madera, neblina baja. Patagonia: viento, estepa, torres del Paine, guanacos.
- **Estado (2026-11-25):** hechos el Norte (sol, remolinos nuevos, geoglifo, mina, animita, llamas), Valparaíso (cerros de casitas en el horizonte, casas, escaleras, ascensor, murales, puerto, playa, adoquín) y Viña del Mar (reloj de flores). Hecho también el Sur: Araucanía (volcán con humo, bosque denso) y Lagos/Chiloé (lago, palafitos, lanchas, ovejas). Hechas también Patagonia (estepa, estancias, molinos, guanacos) y La Antártica (icebergs, pingüinos, focas). Santiago también (horizonte con San Cristóbal y torres, calles con paraderos, semáforos y metro). **La 11.1b está completa**; queda tu visto bueno de que cada mapa se siente como ahí. Cada uno con el mismo molde: `DECO_AMBIENTE`, horizonte propio, vida ambiente y clima.
- Reglas: todo sin imágenes externas (se dibuja con el sistema de sprites propio), sin marcas ni lugares reales con logo; contraste 100 % con `npm run contraste`; sin bajar de 55 fps en el banco de rendimiento; el bot no debe caer más de 10 puntos por el cambio de decorado.
- **Listo cuando:** cada ambiente tiene capturas antes/después en `docs/` y tú das el visto bueno de que "se siente como ahí".

### 11.2 — Logros y bestiario (1 jornada) — HECHO (2026-11-25: 44 logros, bestiario con silueta, pruebas)
- De 7 a ~35 logros: por jefe, por personaje, por arma/evolución, por km, por ambiente, por enemigo, de práctica ("sin recibir daño en un jefe"), secretos (2–3).
- **Bestiario**: pantalla que registra enemigos, jefes y armas vistos (con silueta hasta descubrirlos).
- Recompensas: lucas, bandanas y algún desbloqueo (un arma o un fondo de Cucha), nada que desequilibre.
- **Listo cuando:** cada logro tiene una prueba que lo dispara, aparece en la pantalla de logros y el bestiario sobrevive al guardado/carga.

### 11.3 — Eventos y cofres en el camino (2 jornadas) — HECHO (2026-11-25: cofre, animita y feriante; nueva línea base del bot 15 % y 7,25 min)
- **Cofre de la ruta:** aparece cada ~90 s, se abre con lucas del propio viaje y su precio sube con cada apertura (idea de Megabonk).
- **Animita:** santuario gratis; quedarse cerca unos segundos da una bendición temporal.
- **Feriante:** trato con riesgo (más botín, enemigos extra o menos vida un rato).
- Máximo 1 evento activo a la vez y nunca durante un jefe. Mismo flujo con la semilla para que la ruta del día sea justa.
- **Listo cuando:** el bot medio no cae más de 10 puntos en llegada a Patagonia y los eventos se ven y leen bien en 480×270.

### 11.4 — Élites y minijefes (1–2 jornadas) — HECHO (2026-11-25: un guardián por zona con pisotón anunciado y botín propio)
- Un élite por zona a ~mitad de camino (variante grande de un enemigo propio del ambiente, con un ataque con aviso) y un botín propio (caja o cofre).
- **Listo cuando:** un build decente los derrota en 15–40 s y sueltan algo que se note.

### 11.5 — Más armas y pasivas (2 jornadas, la tanda más grande) — HECHO (2026-11-25: 5 armas y 6 pasivas; nombres de la lista, a revisar contigo)
- +5 armas (hasta 16) y +6 pasivas con efecto real, con evoluciones para las armas nuevas. Ideas: **Choripán** (proyectil con rebote), **Pandero** (onda corta que empuja), **Cacerola** (escudo que devuelve daño), **Trompo-Boleadora** (cadena entre dos enemigos), **Sopaipilla caliente** (quema); pasivas: Mate (regenera al quedarse quieto), Poncho (menos daño de proyectiles), Chasquilla (más crítico)…  (nombres a revisar contigo).
- Cada arma entra solo si el banco de armas del bot la ubica entre el 70 % y el 130 % del promedio.
- **Listo cuando:** `tests/contenido.test.ts` cubre todo lo nuevo, contraste sigue 100 % y el banco de armas queda documentado.

### 11.6 — Dificultad después de ganar: Pasajes (1 jornada) — HECHO (2026-11-25: tres pasajes, selector en Elegir personaje)
- Tres pasajes con enemigos más duros y premios mayores: Pasaje normal, "Hora punta", "Último bus". Se desbloquean al ganar el anterior. La Antártica sigue como modo infinito.
- **Listo cuando:** el bot experto gana el pasaje 1 en ~50–70 % de las partidas, y el 3 en menos del 15 %.

### 11.7 — Volantín, claridad y estadísticas (1–2 jornadas) — HECHO salvo el tope de enemigos visibles (2026-11-25: volantín con picada y peso al corte, halo en proyectiles enemigos y pestaña Marcas; el tope no se tocó para no mover el equilibrio sin tus partidas)
- Volantín: aplicar la idea 3 "picada" + la 1 "más peso al corte" (lo decides tú); probar con una partida tuya.
- Legibilidad: tope de enemigos visibles y contorno de proyectiles enemigos, medido con el banco de rendimiento.
- Pantalla de estadísticas (mejores marcas, personaje más usado, causa de muerte más común).

### 11.8 — Prueba humana y salida (lo hacemos juntos)
- **Tú**: 3 partidas (minuto y causa de muerte), una prueba en móvil real y dos teléfonos para la ruta del día, instalar la PWA y probar sin conexión en Chrome, oír la mezcla con audífonos.
- **Yo**: ajustar el equilibrio con tus datos, subir capturas a itch.io y publicar.

## Orden recomendado
11.0 → 11.1 → **11.1a (pantalla y Cucha)** → 11.1b (mapas vivos) → 11.2 → 11.3 → 11.4 → 11.5 → 11.6 → 11.7 → 11.8. Los logros van antes que los eventos para poder premiarlos; el código se ordena primero porque los eventos tocan `runScene`.

## Lo que necesito que decidas
1. ¿Apruebas el orden? (si quieres ver novedades jugables rápido, se puede adelantar 11.5 antes que 11.2).
2. Volantín: ¿"picada" + "más peso al corte"?
3. ¿Los nombres de las armas y pasivas nuevas de arriba te sirven, o prefieres otros?
4. ¿Autorizas descargar un ladrido CC0 (te digo archivo, fuente y peso antes)?
5. ¿El cooperativo en pantalla compartida queda fuera de esta fase? (lo dejo para la Fase 12).
