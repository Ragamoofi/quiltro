# QUILTRO

Un quiltro. 4.300 km de Chile. Puro aguante.

**Jugar:** https://ragamoofi.github.io/quiltro/ · **Sprites:** https://ragamoofi.github.io/quiltro/sprites.html

Roguelite de supervivencia en pixel art con meta incremental. Diseño completo en [docs/GDD.md](docs/GDD.md).

## Desarrollo

Requiere Node 22.18+ (usa TypeScript nativo de Node para el script de sprites).

```
npm install
npm run dev        # juego en http://localhost:5173, sprites en /sprites.html
npm run check      # lint + tipos + pruebas
npm run build      # build de producción en dist/
```

- **F1** (o `?debug` en la URL, o tres toques en la esquina superior izquierda): panel de depuración.
- **Sprites:** se dibujan como texto en `src/art/sprites/`. El servidor de desarrollo regenera la hoja al guardar.
- **Retocar sprites a mano:** `npm run sprites:exportar`, copia a `sprites-retocados/` los PNG que quieras cambiar, edítalos y quedan en el juego (instrucciones en [sprites-retocados/LEEME.md](sprites-retocados/LEEME.md)).
- **Contenido:** `src/data/`. **Textos:** `src/i18n/es-CL.json`.

## Publicación

Cada push a `main` corre lint, pruebas y build, y publica en GitHub Pages (Settings → Pages → Source: GitHub Actions).
