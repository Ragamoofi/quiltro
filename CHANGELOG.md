# Changelog

Todos los cambios importantes de QUILTRO. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

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
