# Cómo retocar los sprites (sin terminal)

En la carpeta del juego (`Documentos\QUILTRO`) hay tres archivos que se usan con **doble clic**:

| Archivo | Para qué sirve |
| --- | --- |
| `1 - Sacar los sprites.bat` | Saca todos los dibujos del juego como imágenes PNG y abre dos carpetas. |
| `2 - Probar el juego en mi PC.bat` | Abre el juego en tu navegador con tus retoques puestos. |
| `3 - Subir mis retoques.bat` | Sube tus retoques a la página publicada del juego. |

## Paso a paso

1. **Doble clic en `1 - Sacar los sprites.bat`.** Se abre una ventana negra que trabaja unos segundos y luego se abren dos carpetas:
   - **`sprites-editables`**: todos los dibujos del juego, ordenados en subcarpetas (`personajes`, `enemigos`, `armas`, `decoracion`…).
   - **`sprites-retocados`**: esta carpeta, donde van tus versiones.

   Cada imagen es **una animación**, con sus cuadros uno al lado del otro. Por ejemplo, `personajes\gato__trotar.png` es el gato trotando: 4 dibujos de 24×24 píxeles en fila. También está `_paleta.png` con los 32 colores del juego.

2. **Copia** (no muevas) a `sprites-retocados` solo las imágenes que quieras cambiar.

3. **Ábrelas en tu programa de dibujo** (Aseprite, Piskel, Photoshop, Krita, Paint.NET…), dibuja y **guarda como PNG**. Reglas:
   - No cambies el **nombre** del archivo.
   - No cambies el **tamaño** de la imagen ni la cantidad de cuadros. Dibuja dentro de cada cuadro lo que quieras.
   - Usa los colores de `_paleta.png`. Si usas otro, el juego lo cambia por el más parecido de la paleta.
   - Lo que dejes transparente queda transparente en el juego.

4. **Doble clic en `2 - Probar el juego en mi PC.bat`.** Se abre una ventana negra (déjala abierta) y a los segundos el navegador con dos pestañas: el juego y una página con todos los sprites animados. Mientras esa ventana esté abierta, **cada vez que guardes un PNG el juego se recarga solo** con el cambio. Para terminar, cierra la ventana negra.

5. **Cuando te guste, doble clic en `3 - Subir mis retoques.bat`.** Revisa tus imágenes y las sube; en unos 2 minutos aparecen en la página del juego (si no las ves, recarga con Ctrl+F5).

## Si algo no sale

- En la ventana negra aparece una línea por imagen: **✓** si entró al juego, **✗** si hay un problema, con la explicación (casi siempre el nombre o el tamaño).
- Para volver al dibujo original de una imagen, bórrala de `sprites-retocados`.
- El destello blanco al recibir daño, el borde dorado de los élites y los colores de pañoleta del quiltro se generan solos a partir de tu dibujo: no hay que dibujarlos aparte.
- Si una imagen es demasiado chica para editarla cómodo, tu programa puede hacer zoom (en Aseprite y Piskel es lo normal: se dibuja píxel a píxel con zoom).
