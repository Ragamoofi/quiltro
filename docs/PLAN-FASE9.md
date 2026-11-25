# Plan de la Fase 9 — Contenido, lectura visual y balance con datos

Escrito después de revisar el código y probar el juego. Regla de la fase: **primero se mide, después se cambia, y cada tanda se vuelve a medir.** No se avanza de sub-fase hasta cumplir su criterio de salida.

## 1. Lo que encontré (diagnóstico)

### Lectura visual
- El suelo del Norte es marrón rojizo oscuro (se ve en la captura de partida) y los enemigos del Norte (zancudo, jote, guanaco) son oscuros o terrosos: se pierden. Hoy no hay ninguna medida de contraste, solo "a ojo".
- Las 4 zonas comparten el mismo sistema de suelo (`world/floor.ts`: baldosas de 16 px con variantes). Cambiar la paleta de un suelo es barato.

### Cartas y rarezas
- Hay 4 rarezas (común 70 %, rara 22 %, épica 7 %, legendaria 1 %), pero **casi no se notan**:
  - En las armas, la rareza da `(mult − 1) × 0,2` de daño: rara +10 %, épica +20 %, legendaria +40 %. Un 20 % de daño no se siente como "me salió una épica".
  - En los rasgos multiplica el efecto de ese nivel (×1,5 / ×2 / ×3). Es mejor, pero el jugador solo ve un número más grande.
  - Visualmente la rareza es solo el color del borde y una palabra. El borde épico usa el color `K` (gris oscuro), casi invisible sobre el fondo oscuro de la pausa. Solo la legendaria tiene un aviso especial.
- Resultado: elegir carta es casi siempre "la de arriba a la izquierda". Falta emoción de tirada.

### Pasivas (rasgos)
- Hay 8 rasgos, cada uno sube **una sola estadística** (velocidad, armadura, vida, área, daño, proyectiles, enfriamiento, imán). Máximo 4 equipados. No hay sinergias ni efectos con carácter, así que la decisión es aburrida.
- Armas: 6 + ¡GUAU!, 4 espacios, 7 evoluciones (una por arma, atadas a un rasgo).

### Mundo y ciudades
- 12 enemigos normales en 4 zonas (2 a 4 por zona) y 4 jefes. Las ciudades solo son un nombre en el HUD y un cartel (Valparaíso, Chiloé). No cambian lo que ves.
- Horizonte y decorados existen (`world/horizon.ts`, `world/decor.ts`) y se pueden reusar como base de "escenarios por ciudad".

### Balance (lo que ya sabíamos y lo que no)
- Fase 4: en 10 viajes simulados solo 1 llegó al jefe final y 5 murieron en el Centro (min 4–5): **el Centro es un muro**. Las peleas con jefes duran 65 s, 65 s, 130 s y 270 s con cartas al azar (meta: 45–90 s).
- Aquel bot no quedó guardado en el repositorio. Hoy no hay herramienta para repetir la medición, y el bot de prueba de la Fase 8 no se mueve (muere a los 27 s), así que no sirve para balancear.
- Medido en la Fase 8: 316 enemigos = 0,43 ms por cuadro. Hay margen de rendimiento para agregar contenido.

## 2. Qué opino de los "pilares"

Me gusta, pero lo veo como **dos cosas distintas** y propongo hacer las dos, en este orden:

1. **Pilares dentro de la partida (sinergias de build).** Cada rasgo pertenece a un pilar. Tener varios rasgos del mismo pilar da bonos de set, como en Megabonk o Vampire Survivors. Es lo que más cambia cómo se juega.
   - **Garra** (daño y velocidad de ataque), **Aguante** (vida y armadura), **Olfato** (comida, imán y suerte), **Barrio** (compañeros y área).
   - Bono a 2 y a 4 puntos entre los rasgos del pilar, p. ej. Aguante 4: "al caer a menos de 25 % de vida, un escudo de 3 s, una vez por minuto".
2. **Pilares en La Cucha (meta).** Las mejoras de La Cucha se reorganizan en los mismos 4 pilares como ramas. Cada pilar tiene un nivel que sube al comprar y desbloquea pasivas permanentes. Así La Cucha deja de ser una lista plana y se conecta con el juego.

Si cuando dijiste "pilares" pensabas solo en una de las dos, dímelo y la otra queda para después.

## 3. Cómo se va a medir (herramienta de balance)

El bot se guarda en el repositorio (`src/debug/bot.ts`, solo con `?debug`) y se corre desde el navegador con `__quiltroBot.run(...)`, en tandas cortas para no colgar la página.

- **Tres niveles de habilidad:** novato (esquiva poco, cartas al azar), medio (esquiva y junta comida, cartas razonables) y experto (esquiva bien, cartas por sinergia, usa ¡GUAU! y dar hilo).
- **Datos que registra por viaje:** minuto de muerte y causa (enemigo o jefe), nivel, muertes, daño recibido por minuto, daño hecho **por arma**, duración de cada jefe, cartas ofrecidas y elegidas, tiempo de CPU por cuadro.
- **Metas (por tanda de 20 viajes por nivel de habilidad):**
  - Novato: pasa el Centro (min 6) en ≥ 30 % de los viajes y llega al Sur en ≥ 10 %.
  - Medio: llega a Patagonia en ≥ 50 %; vence al jefe final en 15–30 %.
  - Experto: vence al jefe final en 40–60 %.
  - Ninguna zona concentra más del 40 % de las muertes del novato (hoy el Centro concentra ~60 %).
  - Jefes: 45–90 s con un build medio.
  - Paridad: el daño por segundo de cada arma, a igual nivel, dentro de ±25 % del promedio de las demás.
  - Pasivas: ninguna se elige más de 2 veces la media ni menos de la mitad (tasa de elección con el bot medio).
  - Rendimiento: ≤ 2 ms por cuadro con 300 enemigos en el PC (≈ 10× de margen para un celular de gama media).
- **Límite honesto:** un bot sirve para comparar versiones, encontrar armas rotas o inútiles y detectar muros. No reemplaza que tú juegues. Al terminar cada tanda te pido jugar 2 o 3 viajes para el "feel", y los números finales se ajustan con lo que sientas.

## 4. Sub-fases y criterios de salida

### 9.0 — Herramientas y línea base
- Bot + telemetría + informe en tabla (`docs/BALANCE.md`) con las **cifras de partida del juego actual**, antes de tocar nada.
- Prueba automática de datos: cada arma tiene evolución y rasgo pareja, cada rasgo pertenece a un pilar, todos los textos existen, ningún sprite fuera de la paleta.
- **Sale cuando:** el informe base está publicado y repetirlo da resultados comparables (misma semilla = mismo viaje).

### 9.1 — Lectura visual de los suelos
- Script de contraste (`scripts/contraste.ts`): para cada zona y cada enemigo, mide la diferencia de luminosidad entre el cuerpo del sprite y las baldosas del suelo, y falla si es menor que el umbral.
- Rehacer los 5 suelos con más luz y menos ruido. Norte: arena beige y ocre con salitre blanco, y cactus y rocas como acento. Revisar si algún enemigo necesita más contorno o un tono más claro.
- **Sale cuando:** el script pasa para todos los enemigos y tú confirmas con capturas lado a lado (antes y después) que se lee bien.

### 9.2 — Rarezas, cartas y pilares en partida
- **Cartas con presencia:** marco, fondo y brillo propios por rareza (común gris, rara azul, épica violeta, legendaria dorada con partículas), sonido distinto por rareza y una pequeña animación de revelado. Colores dentro de la paleta de 32.
- **Rareza con efecto real:** además del número más grande, las épicas y legendarias traen una línea extra (p. ej. +1 proyectil, o una propiedad nueva). Se prueba con el bot que una épica valga claramente más que una rara.
- **Pilares:** sistema de etiquetas + bonos de set a 2 y 4 puntos, con su aviso en el HUD y en las cartas ("Aguante 2/4").
- **Sale cuando:** el informe de paridad cumple las metas y una carta épica o legendaria se distingue de lejos en una captura.

### 9.3 — La Cucha rehecha
- Rediseño de la escena: calle y barrio, la casa más grande en el centro, mejoras visibles en la casa, vecinos en posiciones fijas con sus cosas. Se organiza por los 4 pilares. Navegación clara con teclado, toque y control, en horizontal y vertical.
- Antes de dibujar te muestro un boceto de la distribución en texto/imagen para que lo apruebes.
- **Sale cuando:** apruebas el boceto, la escena funciona en horizontal y vertical, y la compra de mejoras sigue pasando las pruebas de La Cucha.

### 9.4 — Ciudades icónicas como escenarios
Lista inicial (ajustable): **Arica** (el Morro), **Antofagasta** (arco de piedra en la costa), **Santiago** (cordillera nevada y cerros), **Valparaíso** (cerros con casas de colores, escaleras y ascensor), **Temuco** (araucarias), **Puerto Montt/Chiloé** (palafitos y mar), **Coyhaique** y **Punta Arenas**.
- Cada ciudad tiene: un horizonte propio mientras se pasa por ella, decorados en el suelo y un cartel con animación. Solo sitios naturales o genéricos, sin marcas ni edificios con logos, según "Líneas que no cruzamos".
- Un mini-evento corto por ciudad (p. ej. Valparaíso: "perros de los cerros" te ayudan 15 s). Neutral o con premio chico, medido con el bot para que no rompa el balance.
- **Sale cuando:** cada ciudad se reconoce en una captura, no hay caída de rendimiento con 300 enemigos y los eventos no mueven las metas de supervivencia más de 5 puntos.

### 9.5 — Contenido nuevo, en tandas con balance
Cada tanda se mide con el bot antes de la siguiente.
- **Tanda A (armas):** 4 armas de juegos de barrio chilenos: **Bolitas** (canicas que rebotan en abanico), **Emboque** (bola con cuerda que va y vuelve y atraviesa enemigos), **Elástico** (banda que barre una línea), **Ronda** (compañeros que giran y pegan). Cada una con 5 niveles, evolución, sprite y sonido propios.
- **Tanda B (pasivas):** 6 rasgos con carácter, repartidos en los pilares: **Colmillo** (crítico), **Cola alegre** (velocidad al matar), **Siesta** (escudo si te quedas quieto), **Hambre de lunes** (más experiencia), **Cascabel** (empuje de enemigos cerca), **Manada chica** (un perrito que ataca). Con sus bonos de pilar.
- **Tanda C (enemigos y ataques):** 1 enemigo nuevo por zona y 1 ataque nuevo por jefe. Cuidando el Centro: se baja antes el muro de la Fase 4.
- **Sale cuando:** cumple las metas de paridad y de supervivencia con todo el contenido nuevo.

### 9.6 — Volantín, balance final y lanzamiento
- Rediseño del ataque del volantín (las 5 ideas de `docs/PENDIENTES.md`: se elige una y se prueba).
- Pasada final de balance con 100 viajes por nivel, informe `docs/BALANCE.md` actualizado, ajuste por tus 2 o 3 partidas, medición de rendimiento y 3 viajes sin errores en la consola.
- Publicación y actualización de textos de itch.io.
- **Sale cuando:** todas las metas de la sección 3 se cumplen y tú juegas y lo apruebas.

## 5. Reglas de trabajo
- Commits chicos por función, `CHANGELOG.md` al día, `npm run check` verde antes de cada publicación.
- Todo texto nuevo en `src/i18n/es-CL.json`; todo número nuevo en `src/data/`.
- Sin descargas ni recursos externos sin tu aprobación. Los sonidos nuevos se sintetizan en código.
- Cada sub-fase termina con: qué hice, cómo probarlo, decisiones fuera del plan y cifras antes y después.

## 6. Riesgos
- **Demasiado contenido de una vez** puede empeorar el balance. Por eso va por tandas con medición.
- **El bot no es una persona.** Sus números se usan para comparar, no como verdad final.
- **Volumen de sprites:** son ~40 sprites nuevos. Es un trabajo largo pero acotado. Si hay que recortar, el orden de prioridad es: lectura visual, rarezas, Cucha, ciudades, armas, rasgos, enemigos.
