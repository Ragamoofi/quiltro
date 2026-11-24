# Changelog

Todos los cambios importantes de QUILTRO. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

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
