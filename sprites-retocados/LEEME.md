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

   En `sprites-editables` también está `_paleta.png` con los 32 colores del juego.

   Cada sprite tiene su propia carpeta (por ejemplo `personajes\gato\`) con tres tipos de archivo. **Elige el que te acomode:**

   | Archivo | Qué es | Cuándo usarlo |
   | --- | --- | --- |
   | `gato__base.png` | **Un solo dibujo** del gato (de pie). | **El más rápido.** Lo que cambies aquí (la cara, un sombrero, el color de los ojos) se copia solo a **todos** los cuadros de **todas** las animaciones donde ese pedazo aparece igual, aunque el cuerpo esté un par de píxeles más arriba o más abajo. |
   | `gato__HOJA.png` | **Todas** las animaciones del gato en una imagen, una por fila. El orden de las filas está en `gato__HOJA.txt`. | Para retocar varias animaciones a la vez, viéndolas todas juntas. |
   | `gato__trotar.png` (y las demás) | **Una** animación, con sus cuadros en fila. | Para arreglar una animación puntual. |

   Si usas varios para el mismo sprite, se aplican en ese orden: primero el `base`, después la `HOJA` y al final las animaciones sueltas (la más específica gana).

   **Ojo con el `base`:** el cambio solo se pega donde el cuadro tenía lo mismo que el dibujo original. Así, si le cambias el color de ojos al gato, no le aparece un ojo abierto cuando parpadea o duerme. En la ventana negra te dice en cuántos cuadros entró (por ejemplo «el cambio entró en 23 de 25 cuadros») y en cuáles no calzó; esos los retocas en la hoja o en su animación.

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
