# Arte externo integrado en QUILTRO

| Recurso | Autor | Fuente | Licencia / permiso |
| --- | --- | --- | --- |
| Zorro: reposo y caminar | ScratchIO | https://opengameart.org/content/animated-wild-animals | CC0 1.0 |
| Charlie The Capybara: reposo y caminar | niffirgGames | https://niffirggames.itch.io/charliethecapybara | El autor permite cualquier uso salvo revender el recurso; crédito opcional |

Tamaño, contorno y poses adicionales adaptados por QUILTRO. Se conservan los colores originales del arte importado. Las poses adicionales son adaptaciones del proyecto, no animaciones originales de estos autores. Las imágenes del ciervo de ScratchIO solo se descargaron como referencia y no se incluyen en la hoja de sprites del juego.

Procedencia, permisos y hashes: art-source/README.md en el repositorio.

---
# Licencias de recursos

Todo recurso descargado (sonidos, fuentes, SoundFonts, música) se registra aquí con su fuente y licencia.

| Recurso | Archivo | Autor | Fuente | Licencia |
| --- | --- | --- | --- | --- |
| Ver tabla de arte externo arriba | | | | |

## Hecho en el proyecto

- Excepto el zorro y el capibara importados, los sprites, la fuente de píxeles (3×5 con tildes), el logo y el arte promocional son originales, dibujados como matrices de texto en `src/art/`.
- Toda la música y todos los efectos de sonido son originales, compuestos y sintetizados en código (`src/audio/`) con Web Audio y Tone.js. No se usa ninguna muestra ni archivo de audio externo.
- Ningún personaje, marca, símbolo político ni persona real aparece en el juego.

## Bibliotecas de código (todas con licencia MIT)

| Biblioteca | Uso |
| --- | --- |
| PixiJS | Dibujo en pantalla |
| Tone.js | Música y sonido |
| Vite, TypeScript, Vitest | Compilación y pruebas (no van en el juego publicado) |
| vite-plugin-pwa / Workbox | Instalación y modo sin conexión |
