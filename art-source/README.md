# Fuentes de arte de fauna

Descargadas el 25 de noviembre de 2026. Solo se copian imágenes; no se ejecuta código de los repositorios de origen.

| Archivos | Autor y fuente original | Licencia / permiso | Uso en QUILTRO |
| --- | --- | --- | --- |
| `charlie/charlie.png` | [Charlie The Capybara, niffirgGames](https://niffirggames.itch.io/charliethecapybara) | El autor permite cualquier uso salvo revender el recurso. Crédito opcional; se conserva aquí. | Capibara: reposo y caminar del autor; poses adicionales adaptadas en el proyecto. |
| `scratchio/fox-*.png` | [Animated Wild Animals, ScratchIO](https://opengameart.org/content/animated-wild-animals) | CC0 1.0 | Zorro: reposo y caminar del autor; espejo, tamaño y poses adicionales adaptados. Es un zorro genérico, no una ilustración zoológica exacta del culpeo. |
| `scratchio/deer-*.png` | Animated Wild Animals, ScratchIO | CC0 1.0 | Referencia descargada. No se integra como huemul ni pudú: sus proporciones y astas no corresponden. |

## Procedencia de las copias descargadas

La descarga directa de itch.io y OpenGameArt no resolvía los nombres de dominio desde la terminal. Las imágenes se recuperaron mediante el conector de GitHub desde copias públicas que acreditan las fuentes originales. Los permisos de uso se verificaron en las páginas de los autores / la ficha de licencia.

| Archivo | Copia pública | SHA del blob de GitHub |
| --- | --- | --- |
| charlie.png | [Archivo](https://github.com/kida31/untitled-plant-game/blob/main/Assets/Sprites/charlieTheCapybaraAnimationSheet.png) | `395edea6401509dee8c8f9f7373439a94582ab9c` |
| fox-idle.png | [Archivo](https://github.com/DAnuraag/P/blob/main/assets/fauna/fox-idle.png) | `2c250689ea841b6f3cfb4ea30f1e06e61e05fc31` |
| fox-walk.png | [Archivo](https://github.com/DAnuraag/P/blob/main/assets/fauna/fox-walk.png) | `ce03d2176b177f46b16b93ae92905a17d45e7e6d` |
| deer-idle.png | [Archivo](https://github.com/DAnuraag/P/blob/main/assets/fauna/deer-idle.png) | `2f72afc85d4d5f32b7795b2631f97f88ad922021` |
| deer-walk.png | [Archivo](https://github.com/DAnuraag/P/blob/main/assets/fauna/deer-walk.png) | `8462ee97cb7ff4ebbb1cd801ac2b83629fc344b2` |

## Reproducir y editar

- `npm run sprites:importar-fauna`: regenera `src/art/sprites/faunaImported.ts` y `src/art/faunaPalette.ts` desde las imágenes originales. No necesita red.
- `npm run sprites`: reconstruye la hoja que usa el juego, incluyendo las variantes blancas de impacto.
- `node scripts/review-fauna.ts`: genera comparación estática y animada en `docs/`.
- `npm run sprites:exportar`: exporta todas las animaciones y la paleta completa para retoques.

Se conserva un tamaño común dentro de cada animal a través de todos sus cuadros. Los originales se mantienen intactos. El escalado usa muestreo de píxel sin suavizado, contorno de tinta y colores originales del recurso; la interfaz mantiene sus 32 colores de base.

Las poses de carga, grito, parpadeo, daño, caída, sueño y estiramiento son adaptaciones sencillas del proyecto: no se presentan como animaciones dibujadas por los autores originales. Falta probar su lectura dentro de una partida con enemigos y efectos.

