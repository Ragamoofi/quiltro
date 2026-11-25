# Changelog

Todos los cambios importantes de QUILTRO. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Fase 10.1 — Personajes: arma propia, pasiva única y desbloqueo en orden

#### Cambiado
- **Diez personajes**, cada uno con un arma inicial distinta y una pasiva única (`src/data/personajes.ts`): Quiltro (Volantín, ¡GUAU! 20 % más rápido), Quiltra (Ronda, cura 5 cada 25 enemigos), Gato (Cables, segunda vida gratis), **Zorro** (Emboque, 12 % menos de espera y 10 % de esquivar), Pudú (Rayuela, cuerpo chico y 12 % de esquivar), Pingüino (Chaya, inmune a la ralentización y al viento), **Chingue** (Elástico, aura de daño), **Cóndor** (Trompo, +20 % de daño y recoge desde más lejos), **Guanaco** (Bolitas, un escudo cada 30 s) y Paloma rebelde (Fuegos, ignora los peligros y atraviesa las nubes).
- **Desbloqueos en orden de dificultad:** Quiltro (inicio), Quiltra (Santiago), Gato (3.000 enemigos), Zorro (Temuco), Pudú (Chiloé), Pingüino (vencer al Caleuche), Chingue (5.000 sopaipillas), Cóndor (vencer al Taco), Guanaco (llegar a Punta Arenas) y Paloma (vencer al Vecino Viral). Los personajes ya desbloqueados se conservan.
- La pantalla de elegir personaje muestra la pasiva. El bot puede jugar con cualquier personaje (`__quiltroBot.start(skill, runs, seed, minutos, invencible, personaje)`).
- Pruebas de personajes (`tests/personajes.test.ts`).

### Jefe final nuevo: Cai Cai Vilú

#### Cambiado
- Se quita al Vecino Viral / Tío René (no convencía) y el jefe final de la Patagonia pasa a ser **Cai Cai Vilú** (id `caiCai`), la serpiente marina del mito de Chiloé que levantó las aguas. Cuerpo de 8 segmentos que se arrastra siguiendo a la cabeza, da vueltas alrededor del perro y lo cerca.
- Ataques: **olas** (franjas rosadas con aviso), **remolinos** (círculos con aviso) y, en la fase 2 ("¡Responde Tren Tren!"), el **temblor de Tren Tren** con dos círculos seguros verdes. Textos en `es-CL.json`; el logro dice "Vencer a Cai Cai Vilú".
- Sprites en tres piezas (`caiCai`, `caiCaiCuerpo`, `caiCaiCola`). La Paloma rebelde ahora se desbloquea al vencerla.

### Pantalla en PC (1920×1080)

#### Arreglado
- **El juego se veía chico en monitores de 1080p.** En un navegador de unos 955 px de alto (lo normal en una pantalla de 1920×1080) el juego usaba ×3 y ocupaba solo el 75 % de la pantalla, con barras gigantes a los lados. Ahora, cuando una escala entera deja más del 12 % de borde, sube de a medio paso: **×3,5** a 1920×955 (1680×945 en vez de 1440×810) y ×2,5 en 1366×768. Con ×3,5 cada dos píxeles del juego uno mide 4 y otro 3 píxeles de pantalla, un patrón parejo; la escala entera exacta se mantiene cuando ya llena bien (1920×1080 a ×4).
- **Pantalla completa:** tecla **F** y una fila nueva en Opciones. A pantalla completa en 1080p el juego llena todo a ×4 exacto.
- Pruebas de escala (`tests/core.test.ts`): nunca se pasa de la ventana, a ningún tamaño probado.

### Fase 10.6 — Vida ambiente y Santiago como la Estación Central

#### Agregado
- **Santiago con aire de Estación Central:**
  - Hito del horizonte nuevo: una gran estación de fierro y vidrio con torre de reloj y dos trenes bajo el techo, con la cordillera atrás.
  - Decorado de barrio de comercio: **puestos ambulantes con toldo azul y blanco** (con un vendedor genérico tras el mostrador), carros de comida con sombrilla azul y vapor, cajones de fruta, quioscos y carros de sopaipillas.
  - Cartel: "Puestos con toldo azul, micros y gente apurada."
- **Vida ambiente** (`src/game/world/ambient.ts`): cosas que se mueven solas, no dañan ni bloquean, con su propia semilla (no tocan los dados de la partida). Hasta 14 a la vez:
  - **Santiago:** motos de reparto (casco blanco, caja térmica turquesa, sin marca), autos y gente de ropa distinta caminando apurada.
  - **Costa:** gaviotas cruzando el cielo con sombra.
  - **Desierto:** la sombra de un cóndor planeando.
  - **Araucanía y lagos:** mariposas.
- Sprites nuevos en `src/art/sprites/vida.ts`.

#### Lo que no se hizo, a propósito
- No se pusieron personajes marcados por nacionalidad ni escenas de delincuencia, y la moto de reparto no lleva el nombre ni los colores de ninguna marca real. El GDD pide no usar marcas ni estereotipos de grupos.

### Fase 10.5 — Tonos, suelos y paisaje por ambiente

#### Agregado
- **Un suelo propio por lugar** (`suelo_santiago`, `suelo_costa`, `suelo_lagos`), todos medidos con `npm run contraste` (59 de 59 combinaciones pasan):
  - **Santiago:** pastelón de ciudad con calle: paso de cebra, línea amarilla discontinua y alcantarilla.
  - **Costa de Valparaíso:** piedras mojadas de puerto, grises, con matas de pasto y conchitas.
  - **Lagos y Chiloé:** pasto húmedo con matas claras, charcos, piedras y florcitas.
- **Horizonte por ambiente:** Santiago, con cordillera nevada y una **bruma de smog** beige; la costa, con mar azul y cerros verdes; los lagos, con cielo cubierto y un volcán nevado azulado.
- **Clima por ambiente:** ya no hay gaviotas en el cielo de Santiago (sí en la costa); lluvia fina en los lagos.
- Cada ambiente aplica su suelo, horizonte y clima al entrar a su tramo de kilómetros (`AMBIENTES` ahora lleva `floor`, `look` y `weather`). Pruebas en `tests/ambientes.test.ts`.

### Fase 10.4 — Enemigos por ambiente, y arreglo de la neblina

#### Agregado
- **Ambientes por kilómetro** (`AMBIENTES` en `src/data/zonas.ts`): cada zona se divide según el lugar y el generador de enemigos usa la lista del ambiente donde estás.
  - Desierto: zancudo, jote, guanaco.
  - **Santiago** (km 1.075–1.600): paloma, micro, **colectivo** y **rata de plaza**.
  - **Costa de Valparaíso** (1.600–2.150): paloma, gaviota y lobo marino.
  - Araucanía (2.150–2.700): chonchón, camahueto y basilisco.
  - **Lagos y Chiloé** (2.700–3.225): chonchón, camahueto y lobo marino (el mar del sur).
  - Patagonia: témpano y chingue.
  Ya no hay gaviotas ni lobos marinos en Santiago.
- **Dos enemigos nuevos con sprite propio:** el **colectivo** (auto negro de techo amarillo que embiste tras un bocinazo, más rápido y chico que la micro) y la **rata de plaza** (chica, rápida, en grupos). Pruebas en `tests/ambientes.test.ts`.

#### Arreglado
- **La neblina del Sur se veía como estática de televisión** sobre toda la pantalla (puntos de a un píxel lavanda hasta 62 % de densidad). Ahora es una bruma crema en bloques de 2×2 y tres niveles limpios (hasta 31 %), con una zona despejada más grande alrededor del quiltro, y la lluvia del Sur es más liviana (80 → 45 gotas).

### Fase 10.3 — Equilibrio de los personajes

#### Cambiado
- Medición con el bot de los 10 personajes y tres rondas de ajuste (detalle y tabla en `docs/BALANCE.md`): Quiltra con menos vida y cura más espaciada, Pudú con más vida, esquiva y daño, Pingüino con más vida y armadura y deslizamiento menos brusco, Chingue con más vida y aura más fuerte, Paloma rebelde sin la penalización de daño y con bonos de velocidad, daño y vida, Zorro con algo más de vida. **Ronda:** daño 20→17.
- Ocho de diez personajes quedan dentro del 70 %–130 % del Quiltro. El Pudú sigue más abajo con el bot (50 %), probablemente por cómo el bot usa la Rayuela; pendiente de una prueba humana.

#### Arreglado
- La pantalla final fallaba con el Chingue porque su aura no tenía ícono. Ahora tiene uno, y una fuente de daño sin ícono muestra una huella en vez de fallar.

### Fase 10.2 — Sprites de los personajes

#### Cambiado
- **Rediseño de los 5 personajes que se dibujaban con plantilla:**
  - Quiltra: cuerpo propio crema, oreja caída y chaleco tejido con botón.
  - Gato: cascabel dorado, hocico y calcetines blancos, rayas en la cola y una oreja rota.
  - Pudú: orejas grandes con interior rosado, cuernos con horquilla y un copihue.
  - Pingüino: bufanda a rayas.
  - Paloma rebelde: pañuelo rojo y lentes oscuros.

#### Agregado
- **Cuatro personajes nuevos dibujados** (con todas sus animaciones: quieto, parpadeo, trote, carga, ladrido, daño, muerte, dormir, estirar, silueta y destello): **Zorro culpeo** (cola tupida con punta negra y calcetines oscuros), **Chingue** (franja blanca y cola enorme alzada), **Cóndor** (collar blanco, cabeza rosada con cresta, alas con manchas) y **Guanaco** (cuello largo, lana clara y cara oscura). Ya no hay sprites prestados.
- Los sprites del Chingue y el Guanaco jugables se llaman `chinguePj` y `guanacoPj`, porque `chingue` y `guanaco` ya eran enemigos.

### Fase 9.5 — Armas y pasivas nuevas

#### Agregado
- **4 armas de juegos de barrio**, con 5 niveles, evolución y sprite o dibujo propios:
  - **Bolitas:** ráfaga de canicas en abanico que rebotan al pegar. Evolución **Canica Reina**: cada canica se parte en dos más.
  - **Emboque:** la bola con cuerda sale, pega y vuelve a tu mano. Evolución **Emboque Eterno**: bola gigante que va y vuelve dos veces.
  - **Elástico:** una banda estirada que barre a tu alrededor y empuja. Evolución **Elástico sin Fin**: nunca descansa y es más larga.
  - **Ronda:** un anillo de colores que crece desde el quiltro y golpea a todos. Evolución **Ronda de la Manada**: dos anillos más cada vez.
- **6 pasivas nuevas** repartidas en los pilares: **Colmillo** (crítico), **Cola alegre** (velocidad 2 s tras cada baja), **Siesta** (vida si estás quieto), **Hambre de lunes** (experiencia), **Cascabel** (anillo que empuja a los enemigos chicos) y **Manada chica** (hasta 3 perritos aliados que muerden solos). Con íconos propios, textos de carta y los pilares (Garra tiene 3 rasgos, Aguante 3, Olfato 4, Barrio 4).
- Sistema de pasivas con efecto propio (`src/game/systems/passives.ts`) y pruebas nuevas (`tests/fase95.test.ts`).

#### Cambiado
- Daño base de las armas que no son de área, para compensar que el mazo pasó de 6 a 10 armas y los fuegos y el trompo salen menos veces (ver `docs/BALANCE.md`): volantín 12→15, cables 15→18, chaya 4→5, rayuela 30→36. Con el bot medio, los viajes que vencen al jefe final suben a 25 %.

### Fase 9.4 — Ciudades como escenarios

#### Agregado
- **Nueve hitos en el horizonte** (`src/art/sprites/ciudades.ts`), uno por ciudad, que cruzan la pantalla de derecha a izquierda mientras pasas por ella: el Morro de Arica, La Portada de Antofagasta, la cordillera y los edificios de Santiago, el cerro de casas de colores de Valparaíso, las araucarias y el volcán de Temuco, el volcán y el barco de Puerto Montt, los palafitos y la iglesia de madera de Chiloé, los picos de Coyhaique y el faro y el barco del estrecho en Punta Arenas. Todos originales y genéricos (sin marcas ni símbolos).
- **Decorado local:** mientras la ciudad está cerca, el suelo se llena con su prop (casa de Valparaíso nueva, araucarias en Temuco, iglesias en Chiloé, salitreras en Antofagasta…).
- **Cartel de ciudad** con una frase corta en cada una (antes solo Valparaíso tenía).
- **Mini-evento por ciudad**, una vez por viaje y nunca durante un jefe: Antofagasta, 2 motes con huesillo; Santiago y Temuco, lluvia de comida; Valparaíso, cuatro ladridos de los perros de los cerros alrededor del quiltro; Puerto Montt, 3 motes (curanto); Chiloé, una Caja del Almacén (la Pincoya); Coyhaique, un escudo gratis.
- Pruebas de escenarios (`tests/ciudades.test.ts`) y datos en `src/data/escenarios.ts`. Con el bot, sin errores en consola y sin cambio de CPU; el efecto en el balance está dentro del ruido (ver `docs/BALANCE.md`).

### Fase 9.4b — El Vecino Viral, jefe final nuevo

#### Cambiado
- **El Gran Temblor se retira** (sprite, jefe y textos). Lo reemplaza **El Vecino Viral**, un personaje original (no es nadie real): un vecino con megáfono y celular que lo graba todo. Sprite nuevo en 4 poses (normal y "viral" con la cara roja y la musculosa dorada), 2 fases y ataques con aviso:
  - Fase 1: cono rojo del megáfono con un abanico de gritos y ráfaga de celulares lanzados.
  - Fase 2: llegan los seguidores (6 zancudos cada 7 s) y embiste tras una línea de aviso, terminando con un golpe de área.
- Vida 9.000, contacto 7. Los textos (nombre, frases, logro "De Arica a Punta Arenas") están en `es-CL.json`.

#### Bot de balance
- Esquiva las nubes del chingue y, contra un jefe, se acerca a él. Nueva opción de bot invencible para medir cuánto dura cada pelea. **Las cifras anteriores a este cambio no se comparan con las nuevas** (ver `docs/BALANCE.md`).

### Fase 9.3 — La Cucha rehecha

#### Cambiado
- **Escena nueva** (`src/ui/cuchaScene.ts`): patio de pasto con la casa grande (×3 en horizontal, ×2 en vertical), la vereda con los vecinos de pie y a color con su producción o su precio debajo, y un panel que reemplaza el rectángulo oscuro. Funciona en horizontal y vertical.
- **Objetos en su lugar:** los 12 objetos de mejora quedan puestos en la casa y el patio, apagados (gris lavanda) hasta comprarlos. Tocar uno abre su pilar y resalta su fila.
- **Mejoras por pilares:** pestañas Garra, Aguante, Olfato y Barrio con 3 mejoras cada una, compra directa en la fila con puntos de nivel y costo. Tocar un vecino lo hace amigo si alcanzan las lucas, o avisa cuántas faltan.
- **Barra de abajo arreglada:** Pañoleta, Logros y ¡Viajar! ya no se pisan. El selector de personaje pasó a un cartel junto al panel.

#### Agregado
- **Bonos permanentes por pilar** (`CUCHA_PILARES`): los niveles comprados en un pilar se suman y a los 4 y a los 8 se abre un bono (el mayor reemplaza al menor): Garra +3 % / +6 % crítico, Aguante +15 / +30 vida, Olfato +5 % / +10 % experiencia, Barrio +5 % / +10 % lucas. Son pequeños; no se midieron con el bot porque el bot juega sin mejoras de La Cucha.
- Pruebas de pilares de La Cucha.

### Fase 9.2c — Muro del Centro

#### Cambiado
- Micro: daño 18 → 14. Lobo marino: daño 20 → 15 y vida 140 → 110. Taco: vida 4.000 → 3.000 y daño por contacto 16 → 12. Con el bot, las muertes en el Centro bajan de 6 a 3 (medio) y de 8 a 4 (experto) de cada 20, y el experto llega a Patagonia el 55 % de las veces (antes 25 %). Detalle en `docs/BALANCE.md`.

### Fase 9.2b — Banco de armas y Alicanto

#### Agregado
- Banco de armas en el bot (`__quiltroBot.bench`): arena controlada para medir el daño por segundo de cada arma sola, a distintas densidades de enemigos.
- `Enemies.slam` acepta el origen del daño, para que la telemetría distinga los golpes de jefe.

#### Cambiado
- **Alicanto:** la picada se anuncia con un círculo rojo y se compromete a un punto fijo (antes seguía al quiltro sin aviso); el golpe hace 14, el contacto baja de 14 a 8 y las plumas de 8 a 6. Con el bot medio, las muertes en el Norte bajan de 16 a 7 de 20 y el minuto promedio de muerte sube de 5,6 a 9,1. Detalle en `docs/BALANCE.md`.

### Fase 9.2 — Rarezas, cartas y pilares

#### Agregado
- **Cartas por rareza:** cada rareza se ve distinta de lejos. Común crema con banda gris, rara celeste con banda azul, épica rosada con banda vino y legendaria dorada. Épica y legendaria brillan (borde que parpadea y destellos que giran). La rareza se escribe en una banda en la parte de arriba. Épica suena con una campana; legendaria sigue con acordeón y "¡Bacán!".
- **Rarezas con efecto real en las armas:** rara +15 % de daño, épica +35 % y −10 % de espera, legendaria +70 %, −15 % de espera y +1 proyectil o salto (solo donde el arma tiene espera, proyectiles o saltos). Antes era +10/20/40 % de daño. El texto de la carta lo dice.
- **Pilares** (`src/data/pilares.ts`): Garra (Choro, Al tiro), Aguante (Chalequito, La once), Olfato (Olfato, Pata de perro) y Barrio (La jauría, Cachai). Los niveles de los rasgos de un pilar se suman; a los 3 y a los 7 puntos se abre un bono (el de más arriba reemplaza al de abajo): crítico, vida y un escudo cada 40 s, experiencia, área y un proyectil. Cada carta de rasgo muestra su pilar ("Aguante 2/3") y avisa cuando abre un bono; al tomarla sale un cartel con el nombre y el efecto.
- Pruebas nuevas de pilares y rarezas (`tests/pilares.test.ts`).

#### Cambiado
- Volantín: daño base 8 → 12 y +20 % → +40 % por nivel de daño (el bot lo medía 5 veces más débil que el promedio de las armas). Fuegos artificiales: 20 → 14. Resultados y lectura honesta en `docs/BALANCE.md`.

### Fase 9.1 — Lectura visual de los suelos

#### Agregado
- `npm run contraste` (`scripts/contraste.ts`): mide, para cada zona, si el contorno tinta de cada enemigo, del quiltro y de la comida se separa del suelo (razón de contraste ≥ 3) y si el cuerpo no se funde con él. Forma parte de `npm run check`.

#### Cambiado
- Suelos rehechos: Norte pasa de café oscuro a tierra roja clara (contorno 1,7 → 9,6), Sur de bosque oscuro a pasto con matas (2,5 → 4,9), Patagonia y La Antártica a tonos claros (7 → 13). Antes, 27 de 53 combinaciones fallaban; ahora pasan las 43 que se miden.
- Excepciones declaradas: los témpanos (hechos de hielo a propósito) y la comida (que brilla) solo se miden por el contorno.

### Fase 9.0 — Herramientas de balance

#### Agregado
- Bot de balance (`src/debug/bot.ts`, solo con `?debug`): juega viajes completos con el código real del juego, sin dibujar, en tres niveles de habilidad, y entrega un resumen con alcance, causa de muerte, duración de jefes, daño por arma y cartas.
- Telemetría: el daño recibido se registra por fuente (`damageFrom`) y la última fuente queda como causa de muerte.
- Un viaje del bot no toca el guardado. `Input.override` deja que el bot reemplace los controles.
- Pruebas de datos (`tests/data.test.ts`): evoluciones, textos, rarezas y zonas.
- Línea base de balance en `docs/BALANCE.md`.

### Fase 8 — Pulido y lanzamiento (en curso)

#### Agregado
- Accesibilidad: si el sistema pide menos movimiento (`prefers-reduced-motion`), una partida nueva parte con destellos reducidos y sacudida al 30 %.
- Revisión de licencias (`public/LICENSES.md`): sin recursos de terceros; lista de bibliotecas MIT.
- Textos listos para la página de itch.io (`docs/ITCH.md`).

#### Medido
- Viaje completo simulado (bot con cartas, invencible): llega a 4.300 km con 303 enemigos a la vez y cero errores ni avisos en la consola.
- Con 316 enemigos en pantalla: 0,43 ms por cuadro (peor 0,67 ms) entre simulación y dibujo, en el PC de desarrollo. El presupuesto de un cuadro a 60 fps es 16,6 ms.

### Fase 7 — Ruta del día, compartir y PWA

#### Agregado
- **Azar determinista:** la semilla de una partida se reparte en tres flujos independientes (cosmético, director de enemigos/jefes/peligros/viaje, y cartas/cajas). Lo que haga el jugador ya no cambia qué enemigos aparecen ni qué cartas se ofrecen. Dos partidas con la misma semilla dan lo mismo (verificado: 70 s idénticos al byte).
- **Ruta del día** (`src/meta/daily.ts`): semilla por fecha de Chile (America/Santiago), numerada desde el 2026-11-01. Un intento que cuenta por día (se gasta al empezar, así que cerrar la pestaña no sirve para repetir); los siguientes son práctica con el mismo viaje. Quiltro base sin mejoras de La Cucha, para que sea parejo. Guardado v3.
- **Texto para compartir** con el formato del GDD: 12 cuadrados (🟨🟦🟩⬜, ⬛ = no llegué), ciudad, km, evolución o arma más fuerte e invitación con enlace. Botón "Copiar para el grupo".
- **Tarjeta de 1080×1920** hecha con el mismo pixel art del juego: mapa de Chile con la ruta, km, ciudad, personaje, cuadrados, build y enlace. Botón "Compartir" (hoja de compartir del sistema con la imagen; si no existe, descarga el PNG y copia el texto).
- **PWA** (`vite-plugin-pwa`): se instala y funciona sin conexión (32 archivos precargados, 1,5 MB). Íconos 192/512/180 generados desde el sprite del quiltro.
- **Arte promocional** (`scripts/make-promo.ts`): portada 1280×720, afiche vertical 1080×1920 y cuadrado 1024, hechos con los sprites y la fuente del juego, en `promo/`.
- Panel F1: sección "Ruta del día" (ver estado, iniciar, devolver el intento).

### Fase 6 — Sonido

#### Agregado
- Motor de audio compartido (`src/audio/engine.ts`): un solo contexto para efectos (Web Audio) y música (Tone.js), con compresor en los efectos. Tone.js se descarga en segundo plano (archivo aparte de 79 KB comprimidos) y el contexto recién se crea con el primer toque o tecla, así que no hay avisos del navegador ni se retrasa el primer cuadro.
- Música compuesta en código con Tone.js, sin archivos: cada zona tiene un bucle de 4 compases en 3 capas (base, ritmo, melodía).
  - Norte: charango y bombo lentos, quena y viento.
  - Centro: cumbia con acordeón, güira, caja y bajo, rápida y alegre.
  - Sur: guitarra arpegiada y lluvia, melancólica.
  - Patagonia: cuerdas, timbal y viento, épica.
  - La Antártica: pad y campanitas de cristal.
  - Menú: guitarra tranquila con el barrio de fondo (perros lejanos, pájaros, una micro).
- Las capas se suman con la cantidad de enemigos en pantalla: el ritmo desde 8 y la melodía desde 35. Cambio de zona con transición de 2 s.
- Jefes: la misma música pero con timbales pesados, un bordón grave y el tempo un 12 % más rápido.
- Cielo del Dieciocho: 20 s de cueca en 6/8 con palmas, guitarra y acordeón; después vuelve la música de la zona.
- La pausa, las cartas y la Caja ponen la música "detrás de una puerta" (filtro pasa-bajos); al seguir se abre.
- Efectos nuevos de la tabla del GDD: rasgueo de guitarra al subir de nivel, acordeón y "¡Bacán!" en la carta legendaria, bocina más motor de la micro 0,8 s antes de embestir (paneados hacia donde está), rueda de la Caja con tic de ruleta, monedas al contar las lucas.
- Señales para jugar sin mirar: gong del élite (con paneo), sirena de "¡Te rodearon!", latido cuando queda menos de 25 % de vida, fanfarria de evolución, jingle de zona nueva, introducción del jefe (metales graves y redoble de timbales), victoria y la derrota con "wah-wah" de cumbia.
- Mezcla (GDD): máximo 24 voces, los sonidos repetidos dentro de 30 ms se agrupan, jugador y jefe tienen prioridad (nunca se descartan) y, cerca del tope, el fondo cede ante los avisos importantes. Los efectos se agachan 30 % mientras hay un cartel importante o la presentación de un jefe.
- Panel F1: motor de audio, nivel de salida en vivo, música actual con sus capas, tocar cualquier música o efecto, jefe on/off y cueca de 20 s.
- Los controles de volumen de música y efectos de Opciones ahora hacen efecto.
- 14 pruebas nuevas (partituras bien formadas, capas por intensidad, reglas de mezcla, música para cada zona).

#### Pendiente
- El ladrido real CC0 de la tabla de efectos sigue sintetizado: descargar un archivo necesita tu aprobación (ver docs/PENDIENTES.md).

### Fase 5 — Interfaz y onboarding

#### Agregado
- Carga (1,2 s): logo QUILTRO en letra pixel con sombra, el quiltro moviendo la cola, la barra de carga como un volantín que sube por el hilo y un dato de Chile al azar.
- Intro en 3 viñetas tipo cómic (Arica, el viento se lleva el volantín azul de la Martina, "Yo lo traigo"), 2 s cada una; un toque avanza, "Saltar" la salta. Se ve solo la primera vez (y desde Opciones).
- Final en 4 viñetas al vencer al Gran Temblor, antes de la pantalla de victoria.
- Menú principal: la calle del barrio con el quiltro durmiendo frente a su Cucha (al tocarlo despierta y se estira), palomas caminando y un volantín enredado en los cables. Botones sticker: ¡Viajar!, Ruta del día (Pronto), La Cucha, Logros, Opciones; lucas y récord arriba.
- Elegir personaje: carrusel con el personaje grande trotando, barras de vida, velocidad, crítico y área, y arma inicial; los bloqueados en silueta con su condición.
- Mapa de inicio (1,5 s, se salta con un toque): Chile vertical con las ciudades, la línea punteada saliendo de Arica y "Tu récord: …".
- Tutorial del primer viaje sin pantallas de texto: mano sobre WASD (o el joystick en celular) con "Muévete" hasta que te mueves 1 s; "Tus volantines atacan solos" con los 6 zancudos lentos del segundo 5; "Junta comida para subir de nivel" con la primera comida; brillo en la primera carta; y al minuto 1 un anillo de enemigos inofensivo hasta el primer ¡GUAU!, con "Mantén para dar hilo, suelta para ¡GUAU!" y la tecla. Cada consejo una vez; se apagan en Opciones.
- Opciones completas: volumen de música y efectos, sacudida 0–100 %, números de daño, reducir destellos, modo daltonismo (X en las zonas de peligro y + en las seguras), mantener o alternar para dar hilo, joystick flotante o fijo, calidad (auto/alta/baja), idioma, consejos, copiar/pegar progreso, borrar progreso con doble confirmación y volver a ver la intro. Se guardan (guardado v2 con migración).
- Pausa completa: build con niveles (evoluciones con marco dorado), tiempo, km, enemigos, nivel y vida, y los botones Seguir, Opciones y Pa' la casa. Se abre sola al cambiar de pestaña.
- HUD final: minimapa de Chile en el borde derecho con el puntito del quiltro bajando, y el botón grande de "dar hilo" dibujado en pantallas táctiles.
- Mando: stick izquierdo para moverse, A o RT para dar hilo, Start para pausa, Y para otra partida, cruceta + A para menús y cartas. Teclado: flechas + Enter en menús y cartas (además de 1-2-3).
- Fin del viaje con botón Menú.
- Arte nuevo: los 6 personajes durmiendo y estirándose, la Martina (3 poses), el volantín azul, la mano y la tecla del tutorial.

### Fase 4 — Meta incremental

#### Agregado
- Guardado con versiones en localStorage: migraciones, copia de respaldo (si el principal se corrompe, carga el respaldo) y exportar/importar como código de texto con verificación (en F1 por ahora; en Opciones en la Fase 5).
- Lucas al terminar cada viaje con la fórmula del GDD, +100 por cada zona alcanzada por primera vez, lucas de logros y la mejora Cuenta RUT. Desglose en la pantalla de fin, "¡Llegaste más lejos que nunca!", nuevo personaje desbloqueado y "Te alcanza para…" con el botón de La Cucha brillando.
- La Cucha dibujada: la casita con las 12 mejoras como objetos en su lugar (plato frente a la puerta, cuadro de la nariz y medalla en la pared, herradura sobre la puerta, volantín volando sobre el techo, chanchito, naipe sobre la mesita…). Tocar un objeto muestra nivel, efecto y costo (`base × 1,6^nivel`, redondeado a 5).
- Las 12 mejoras se aplican en la partida: vida, armadura, velocidad, daño, olfato, enfriamientos, volantín extra, suerte en las cartas, Otra mano extra, cuarta carta y Segunda vida (revives una vez con 50 %).
- Los vecinos (la señora del almacén, el conserje, el de la feria y la tía de la once): se hacen amigos con lucas, aparecen saludando en la calle de la Cucha, producen lucas por hora (máx. 8 h, nunca más del 30 % de un buen viaje) y al volver aparece "Mientras no estabas, … te dejó N lucas" con botón Recoger.
- Los 6 personajes con sprite propio y animación completa: El Quiltro, La Quiltra del Chalequito, El Gato del Almacén, El Pudú, El Pingüino de Humboldt (se desliza) y La Paloma Rebelde (vuela sobre los peligros), con sus condiciones de desbloqueo, arma inicial y rasgos. Selector en la Cucha, bloqueados con su condición.
- Los 7 logros, anunciados en la partida apenas se ganan; cada uno da lucas y una pañoleta de color para el quiltro (selector en la Cucha). Logro secreto Guardianes: en La Antártica una pista y una flecha llevan a la isla donde cinco moais amistosos te saludan.
- Flujo: el primer viaje parte directo (menos de 5 s y un toque); después se vuelve a La Cucha. Fin del viaje: ¡Otra, al tiro!, La Cucha y Seguir a La Antártica.
- Panel F1: +1000 lucas, ir a La Cucha, desbloquear todo, exportar, importar y borrar progreso (doble confirmación).

#### Cambiado
- Las lucas por viaje se duplican (`LUCAS_SCALE = 2`): con los valores del GDD cada viaje compraba ~1 mejora y en 10 viajes simulados nunca se llegaba al jefe final.
- El Alicanto vuela más cerca (80 px) y cada 6 s pasa en picada por la órbita corta, porque antes los volantines no lo alcanzaban sin dar hilo. Su abanico de plumas es más legible: 5 plumas más lentas en fase 1 y 4 en fase 2.
- El Caleuche navega más cerca (100×70 px) para que el hilo largo lo alcance.

#### Corregido
- En el primer viaje sin guardado previo, las teclas de las cartas quedaban sin efecto y se podía quedar atrapado en la subida de nivel.

### Fase 3 — Chile completo

#### Agregado
- El viaje: Norte → Centro → Sur → Patagonia, 3 minutos y 1.075 km por zona, con cartel de entrada (título y frase), Valparaíso a mitad del Centro, y un jefe que cierra cada zona. Los km esperan al final de la zona mientras el jefe vive, así que vencer a Chile siempre marca 4.300 km.
- Suelos, decoración y fondo lejano de cada zona: tierra roja de noche con cactus, salitreras y flores (Norte); pastelones, postes con cables, quioscos y cordillera nevada (Centro); pasto, araucarias, iglesias de madera, copihues y volcanes (Sur); nieve, coirón, cercos, hielo y las Torres (Patagonia); hielo azul y auroras (La Antártica). Dos capas de parallax arriba de la pantalla.
- Clima por zona: polvo, gaviotas lejanas, lluvia en píxeles diagonales, nieve horizontal que sigue al viento.
- Peligros: remolinos que empujan (Norte), la micro que no para que cruza en línea recta con aviso de bocina y atropella también a los enemigos (Centro), neblina chilota que tapa los bordes (Sur), viento que empuja al quiltro, a los enemigos y a los proyectiles (Patagonia); en La Antártica rotan cada 30 s.
- Los 10 enemigos nuevos con su comportamiento: jote (vuela en círculos y se lanza en picada con aviso), guanaco (escupe de lejos), micro (se alinea, toca la bocina y embiste atropellando), gaviota (roba comida y huye; si la matas suelta lo robado), lobo marino (se tira encima con aviso de área), chonchón (avanza en ondas, "tue tue"), camahueto (carga y rompe trompos), basilisco (mirarlo de frente 1 s te ralentiza 30 %), témpano (se parte en 3 al morir), chingue (zigzag y nube tóxica). El puma es el élite de la Patagonia: acecha fuera de cámara y salta.
- Proyectiles enemigos rojo copihue con un píxel blanco al centro, y avisos (círculos y líneas que se llenan) para todo ataque peligroso.
- Los 4 jefes, cada uno con presentación de 2 s, barra de vida abajo y 2 fases:
  - El Alicanto: abanicos de plumas; en fase 2 se vuelve invisible salvo los ojos y deja pepitas que explotan.
  - El Taco: culebra de 12 autos y micros con bocinazos en cono; en fase 2 se le sueltan micros de la cola.
  - El Caleuche: barco fantasma con cañonazos avisados; en fase 2 se prenden las luces de fiesta, invoca chonchones y la neblina tapa media pantalla.
  - El Gran Temblor: grietas en línea y caída de piedras; en fase 2 réplicas cada 5 s con zonas seguras verdes y grietas en cruz.
  - Al vencerlos: cámara lenta, fuegos artificiales, lluvia de comida y Caja dorada.
- Las 7 evoluciones (salen primero en la Caja): Cielo del Dieciocho, Trompo Tornado, Apagón, Carnaval, Año Nuevo en Valpo, Persigue autos y Aullido de las 12. Sello "¡Evoluciona!" en la carta que completa una pareja.
- Evento Temblor una vez por partida entre los minutos 4 y 10: la pantalla tiembla, todos se congelan asustados y el juego registra si el quiltro no se movió (para el logro "Ni se inmutó").
- Vencer al Gran Temblor muestra "¡De Arica a Punta Arenas!" y desbloquea "Seguir a La Antártica": modo infinito donde los jefes vuelven más fuertes cada 3 minutos.
- Sonidos nuevos: bocina, "tue tue", retumbo con vidrios, campanita de almacén.
- Panel F1: saltar al minuto, invocar jefe, ir a La Antártica, evolucionar cualquier arma.

#### Cambiado
- La vida de los jefes crece con `1 + 0,05·t` (con la curva de los enemigos, el Gran Temblor tendría ×5,7).
- Los jefes hechos de varias partes reciben un golpe por arma cada 0,12 s, no uno por parte.

### Fase 2 — La partida

#### Agregado
- Experiencia y niveles con la fórmula del GDD; barra dorada arriba con el nivel.
- Subida de nivel: cámara lenta 0,3× por 0,4 s, columna de luz pixel, cartel al azar ("¡Wena!", "¡Esa!"...), y luego 3 cartas tipo naipe que suben con rebote y 80 ms de diferencia. Se eligen con toque, clic o teclas 1-2-3, bloqueadas los primeros 0,4 s. En vertical las cartas se apilan.
- Botones de las cartas: Otra mano (2 por partida), Ni ahí (2 por partida, destierra la opción y la reemplaza) y Paso (+5 lucas).
- Rareza común/rara/épica/"¡Bacán!" (70/22/7/1 %) que multiplica el efecto ×1/×1,5/×2/×3 y cambia el borde de la carta.
- Las 6 armas: Volantín, Trompo (rebota entre enemigos), Maraña de cables (chispazo desde los cables que salta), Chaya (estela de confeti que daña y ralentiza 40 %), Fuegos artificiales (cohetes en arco que explotan sobre el grupo más denso) y Rayuela (tejo en línea recta que atraviesa todo). Mejoras del ¡GUAU! por nivel.
- Los 8 rasgos con su efecto por nivel; La jauría suma proyectiles a todas las armas en nivel 2 y 4. Máximo 4 armas y 4 rasgos.
- Director con la curva de aparición del GDD, élites cada 60 s (borde dorado, ×5 vida) que sueltan la Caja del Almacén, y anillos "¡Te rodearon!" en los minutos 2, 5, 8 y 11.
- Caja del Almacén: la caja tiembla, una ruleta de íconos gira 2,5 s y entrega 1, 3 o 5 mejoras (70/25/5 %).
- Objetos raros: Mote con huesillo (cura 30), Silbido de la vecina (atrae toda la comida) y ¡Temblor! (destruye a los enemigos normales, cartel "Fue un 6,2. Nadie se movió."). Completo y chorrillana listos para la Fase 3.
- Muerte y pantalla de fin "Se te fue la micro" (o "¡De Arica a Punta Arenas!" al llegar al minuto 12): km y ciudad, tiempo, enemigos, nivel, daño por arma en barras, lucas contando y botón "¡Otra, al tiro!" (R).
- Pausa "Pa'l tecito" (Esc/P o botón): build con niveles, Seguir y Pa' la casa con confirmación.
- HUD completo de la partida: km y ciudad al centro, tiempo y enemigos a la derecha, armas y rasgos con puntos de nivel abajo a la izquierda.
- Fuente pixel propia con tildes, Ñ, ¡ y ¿; texto en pantalla generado con la paleta.
- 15 íconos de cartas de 16×16 y sprites de trompo, tejo, cohete, confeti, completo, chorrillana, mote, silbido, temblor y caja.
- Panel F1: +1 nivel, élite, caja, temblor, dar cualquier arma o rasgo.

#### Corregido
- La vibración solo se pide después de que el jugador tocó la página (el navegador la bloqueaba con error en consola).

### Fase 1 — Que se sienta bien

#### Agregado
- Quiltro completo: quieto, parpadeo, trote, cargar ¡GUAU! (agachado, orejas vibrando), ladrar, daño y muerte; destello blanco automático al recibir golpe.
- Movimiento con inercia suave (0,07 s para acelerar, 0,1 s para frenar) y cámara que se adelanta.
- Volantín: 3 volantines de colores en órbita con hilo de 1 px y cola de píxeles. Hilo corto rápido (+25 % daño); mantener abre la órbita en 0,35 s, más lenta, y el quiltro va 15 % más lento.
- ¡GUAU!: anillo de carga de 1,5 s alrededor del quiltro; al soltar lleno, onda de choque con daño 30, empuje fuerte, globo de cómic "¡GUAU!", 2 cuadros invertidos, sacudida y barra de enfriamiento de 6 s.
- Zancudos (enjambres que zigzaguean hacia ti) y bandadas de palomas que vuelan juntas y pasan en picada; enemigos en pool y grilla espacial de 64 px.
- Sopaipillas que saltan del enemigo y vuelan al hocico, con tintineo pentatónico que sube con cada una seguida.
- Juice de la tabla del GDD: números de daño en letra pixel (críticos dorados ×2 con pausa de 40 ms), partículas pixel al morir y empuje a los vecinos, sacudida por trauma en píxeles enteros, borde rojo al recibir daño, parpadeo de invulnerabilidad y viñeta roja con tramado que late bajo 25 % de vida.
- Sonidos básicos sintetizados con Web Audio: corte de papel, "puf", tintineo, ladrido con eco, gemido, carga, aleteo de bandada y zumbido de zancudos según cuántos hay cerca. Máximo 24 voces, agrupación de 30 ms.
- Suelo del Centro con decoración procedural: calles con postes y maraña de cables que se mecen (el quiltro pasa por debajo), quioscos, carros de sopaipillas y grifos, todo ordenado por profundidad.
- HUD mínimo (vida con hueso, enemigos derrotados, comida) y joystick flotante visible en pantallas táctiles.
- Fuente pixel propia de 3×5 para números y textos cortos.
- Panel F1: invencible, +50 zancudos, bandada, "¡Te rodearon!", saltar 1 min, reiniciar, cantidad de volantines, escala de tiempo, escala del mundo, sacudida, volumen, números de daño y reducir destellos.
- `scripts/contact-sheet.ts` para revisar sprites ampliados sin navegador.

#### Cambiado
- Las distancias y velocidades del GDD se multiplican por 0,6 (`TUNING.worldScale`): están pensadas para una vista de ~800×450 y el juego se dibuja a 480×270. Ajustable en vivo desde F1.

### Fase 0 — Base del proyecto

#### Agregado
- Proyecto Vite + TypeScript estricto + PixiJS v8 + Vitest + ESLint.
- Render pixel a resolución nativa 480×270 (270×480 en vertical), escalado entero en píxeles del dispositivo, vecino más cercano y bordes de tinta cuando sobra espacio.
- Bucle de paso fijo a 60 actualizaciones/s con interpolación y escala de tiempo (para cámara lenta).
- Cámara con suavizado, adelanto hacia donde se camina y posición redondeada a píxeles enteros.
- Entrada: WASD/flechas, clic izquierdo/Espacio para "dar hilo", joystick táctil (mitad izquierda) y botón táctil (mitad derecha).
- Aleatoriedad con semilla (mulberry32) y hash de coordenadas para el suelo.
- Paleta de 32 colores en `src/art/palette.ts` a partir de los colores base del GDD.
- Sprites como matrices de texto y script `npm run sprites` que arma `public/assets/sprites.png` + `.json` (validando tamaños y paleta).
- Primer arte: el quiltro (quieto 2 cuadros, parpadeo, trote 4 cuadros con rebote) y 4 baldosas de pastelones del Centro.
- Página `/sprites.html` para revisar cada sprite animado a ×4 sobre los suelos de cada zona, con la paleta.
- Escena de prueba: el quiltro trotando sobre el suelo infinito del Centro.
- Panel de depuración F1 (también `?debug` o tres toques en la esquina superior izquierda): fps, actualizaciones/s, entidades, resolución, escala de tiempo y lugares para los controles de fases siguientes.
- Todo el contenido del GDD en `src/data/` (armas, rasgos, evoluciones, enemigos, jefes, zonas y ciudades, Cucha, vecinos, personajes, logros, fórmulas de balance).
- Todos los textos del GDD en `src/i18n/es-CL.json` con `t()` y formato de miles chileno.
- 30 pruebas (semillas, paso fijo, escalado, paleta, sprites, fórmulas, datos e i18n).
- GitHub Actions: lint + pruebas + build en cada push y publicación en GitHub Pages desde `main`.
