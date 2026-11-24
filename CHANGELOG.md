# Changelog

Todos los cambios importantes de QUILTRO. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

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
