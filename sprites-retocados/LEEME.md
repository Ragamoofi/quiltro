# Sprites retocados a mano

Aquí van los sprites que retoques en cualquier programa (Aseprite, Piskel, Photoshop, Krita, GIMP, Paint.NET…). Lo que pongas en esta carpeta reemplaza el dibujo hecho en código.

## Cómo se hace

1. Exporta los sprites como imágenes:

   ```
   npm run sprites:exportar
   ```

   Se crea la carpeta `sprites-editables/`, ordenada por grupo (`personajes`, `enemigos`, `armas`, `decoracion`…). Cada archivo es **una animación** con sus cuadros uno al lado del otro, por ejemplo `personajes/gato__trotar.png` (el gato trotando, 4 cuadros de 24×24). También queda `_paleta.png` con los 32 colores del juego.

   Si prefieres editar en grande: `node scripts/export-sprites.ts 4` las exporta a ×4.

2. **Copia** a esta carpeta (`sprites-retocados/`) solo las que quieras cambiar. Puedes hacer subcarpetas si quieres ordenarlas.

3. Edítalas y guárdalas como **PNG**, sin cambiar el nombre ni el tamaño (puede ser ×1 o el mismo ×2, ×4… con que lo exportaste).

4. Listo: con el juego abierto en modo desarrollo (`npm run dev`) se actualiza solo al guardar. Si no, corre `npm run sprites`. En la consola sale una línea por archivo:
   - `✓ gato__trotar.png` → entró al juego.
   - `✓ … (12 píxeles pasados al color más cercano de la paleta)` → usaste colores fuera de la paleta y se ajustaron al más parecido.
   - `✗ …` → algo no calza (nombre o tamaño) y explica qué.

## Reglas

- **Mismo tamaño y misma cantidad de cuadros** que la imagen exportada. Puedes dibujar dentro de cada cuadro lo que quieras, pero no agregar ni quitar cuadros.
- **Colores:** se pasan al color más cercano de la paleta del juego para que todo combine. Para tener exactamente el color que quieres, usa los de `_paleta.png`.
- **Transparencia:** lo que tenga menos de la mitad de opacidad queda transparente.
- El destello blanco al recibir daño, el borde dorado de los élites y los colores de pañoleta del quiltro se generan solos a partir de tu dibujo.
- Para volver al dibujo original, borra el archivo de esta carpeta.
- Para ver el resultado: `http://localhost:5173/sprites.html` muestra todos los sprites animados.
