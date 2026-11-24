# QUILTRO — Documento de diseño del juego

Nov 24, 2026 · @Oscar

## Resumen

**QUILTRO** es un roguelite de supervivencia en pixel art con progresión incremental, ambientado en Chile: eres un quiltro con pañoleta que recorre el país de Arica a Punta Arenas defendiéndose con volantines, trompos y fuegos artificiales. Cada partida dura 10 a 12 minutos y la puntuación son los **kilómetros recorridos**.

**La frase de venta:** "Un quiltro. 4.300 km de Chile. Puro aguante."

**Género y referencias:** survivors-like (Vampire Survivors, Brotato) con meta incremental: la Cucha del quiltro se mejora entre partidas y los vecinos le dejan comida aunque no juegues. Lo que lo diferencia es un solo botón con mucha habilidad: **mantener para dar hilo al volantín, soltar para un ¡GUAU!** que empuja a todos.

### Por qué puede volverse viral en Chile (y afuera)

- **Identidad que se comparte sola:** el quiltro, el completo, la micro que no para, el temblor que nadie pesca, el Dieciocho y el Año Nuevo en Valpo. Un chileno lo reconoce en un segundo y lo manda al grupo.
- **Un número geográfico que se presume:** "Llegué a Chiloé" o "Llegué a 3.120 km". El mapa de Chile, largo y angosto, es literalmente la barra de progreso.
- **Momentos para TikTok:** un cielo lleno de volantines en la evolución "Cielo del Dieciocho", el jefe El Taco (una culebra de autos), el evento Temblor con el cartel "nadie se movió".
- **Ruta del día:** misma semilla para todos, con un resultado en texto para copiar al grupo de WhatsApp (como Wordle).
- **Primeros 30 segundos fuertes:** juegas desde el primer toque, y en el minuto 1 ya subiste de nivel 3 veces.
- **Navegador y celular:** un enlace de GitHub Pages basta para compartirlo.

### Líneas que no cruzamos (para que sea viral y no polémico)

- Nada de personas reales, políticos, carabineros ni símbolos políticos. El quiltro protagonista es caramelo con pañoleta **azul**, para no confundirse con ningún perro símbolo de una causa.
- Nada de marcas reales ni personajes con derechos (Condorito, la Roja, clubes de fútbol, canales de TV).
- Ningún grupo de personas como enemigo ni chistes de estereotipos (nada de "flaites" ni regiones ridiculizadas). Los enemigos son animales, objetos, el clima y criaturas de la mitología.
- Los moais de Rapa Nui no son enemigos: aparecen solo como guardianes amistosos en un logro secreto, con respeto.
- Sin alcohol: el "terremoto" es el sismo, no el trago.

### Qué no repetimos de proyectos anteriores

| Problema anterior | Cómo lo evita QUILTRO |
| --- | --- |
| Mapa feo y estático (juego en Unity) | Cinco zonas de Chile dibujadas con capas de parallax, clima y vida (palomas, gaviotas, cables) |
| Mecánicas y animaciones que se sentían mal | Fase 1 dedicada solo a la sensación: movimiento, impacto, sacudida y sonido antes de agregar contenido |
| Faltaban menú, tutorial y menús bonitos | Todas las pantallas están diseñadas en este documento desde el día uno |
| Mucho texto y decisiones (RASCENSO) | Cero lectura obligatoria: todo se decide en 2 segundos con cartas visuales |
| Interfaz solo para escritorio 1920×1080 | Pensado primero para celular vertical y horizontal, y escritorio |
| Alcance enorme | Contenido acotado: 6 armas, 8 rasgos, 12 enemigos, 4 jefes |

## Bucle de juego

El jugador repite un ciclo de 5 a 20 segundos (esquivar, recoger, mejorar) dentro de un viaje de 10 a 12 minutos, y cada viaje deja lucas para la Cucha, que hace el siguiente viaje más largo.

```
Esquivar y ladrar -> Recoger sopaipillas -> Subir de nivel (1 de 3 cartas)
        ^                                           |
        |                                           v
  Avanzar al sur (zonas, élites, jefes) <- Build más fuerte (armas, rasgos, evoluciones)
        |
        v
Fin del viaje (km + lucas) -> La Cucha (mejoras, personajes, lucas idle) -> otro viaje, ya más fuerte
```

**Momento a momento (0–20 s).** Te mueves esquivando; los volantines cortan solos con su hilo curado. Mantienes pulsado para dar hilo cuando los enemigos están lejos, y sueltas para un ¡GUAU! cuando te rodean. Recoges sopaipillas, y suena un tintineo que sube de tono con cada una seguida.

**Viaje (10–12 min).** Cuatro zonas de unos 3 minutos (Norte, Centro, Sur y Patagonia), cada una cerrada por un jefe. Subes de nivel unas 40 veces. Entre el minuto 6 y el 9 aparecen las primeras evoluciones, el pico de poder. Al minuto 12 llega el jefe final, El Gran Temblor. Si lo vences, desbloqueas **La Antártica**, el modo infinito para récords.

**Meta (entre viajes).** Las lucas se gastan en la Cucha: mejoras permanentes, nuevos personajes y vecinos que dejan comida mientras no juegas (hasta 8 horas acumuladas).

**Ritmo emocional buscado por viaje:** 0–1 min poder inmediato · 2–3 min primera tensión y primer jefe · 4–6 min build tomando forma · 6–9 min evolución y pantalla llena de volantines y fuegos · 9–12 min supervivencia al límite · final épico, o muerte con un "¡casi!" que pide otra partida.

## Mecánicas

El jugador solo controla dos cosas: dónde está el quiltro y cuánto hilo le da al volantín; todo lo demás ataca solo. Así se entiende en 5 segundos y deja espacio para la habilidad.

### Controles

| Acción | Teclado y ratón | Mando | Celular |
| --- | --- | --- | --- |
| Moverse | WASD o flechas | Stick izquierdo | Joystick virtual donde se toca (mitad izquierda) |
| Dar hilo | Mantener clic izquierdo o Espacio | Mantener A o RT | Mantener botón grande (mitad derecha) |
| ¡GUAU! | Soltar con la carga llena | Soltar | Soltar |
| Pausa y build | Esc o P | Start | Botón de pausa arriba a la derecha |
| Otra partida (pantalla final) | R | Y | Botón "¡Otra, al tiro!" |

### Dar hilo y el ¡GUAU! (mecánica central)

- **Hilo corto (por defecto):** los volantines giran cerca (radio 70 px) y rápido (2,4 vueltas/s), con +25 % de daño.
- **Dar hilo (mantener):** la órbita se abre suave hasta 180 px en 0,35 s, giran más lento (1,1 vueltas/s), la cámara se aleja un 15 % y el quiltro se mueve un 15 % más lento. Sirve para limpiar enemigos lejanos.
- **Carga del ¡GUAU!:** mientras mantienes, se llena un anillo alrededor del quiltro en 1,5 s y le vibran las orejas. Si sueltas con el anillo lleno, recoge el hilo de golpe y lanza un ladrido: onda de choque de 220 px, 30 de daño base, empuje fuerte y un globo de cómic "¡GUAU!". Enfriamiento 6 s.
- **Por qué funciona:** dar hilo es poderoso pero te hace lento, y el ¡GUAU! premia soltar en el momento justo. Es una decisión constante, no un botón que se deja apretado.

### Estadísticas del Quiltro (base)

Vida 100 · velocidad 210 px/s · olfato (radio de recolección) 60 px · armadura 0 · crítico 5 % (×2) · 3 volantines de 8 de daño. Invulnerabilidad de 0,5 s al recibir daño.

### Armas: juegos típicos — máximo 4 a la vez

| Arma | Qué hace | Nivel 1 | Mejora por nivel (hasta 5) |
| --- | --- | --- | --- |
| Volantín | Volantines con hilo curado que orbitan según el hilo | 3 volantines, 8 daño | +1 volantín en nv 2 y 4, +20 % daño en 3 y 5 |
| Trompo | Trompos que salen girando y rebotan entre enemigos | 1 trompo cada 1,2 s, 14 daño, 2 rebotes | +1 trompo, +1 rebote, −10 % enfriamiento |
| Maraña de cables | Chispazo del poste que salta entre enemigos | 3 saltos, 15 daño, cada 2,2 s | +1 salto, +15 % daño |
| Chaya | Estela de confeti y serpentina que daña y ralentiza 40 % | 4 daño cada 0,25 s, dura 2 s | +30 % duración, +25 % daño |
| Fuegos artificiales | Cohetes que suben y explotan en área sobre grupos | 2 cada 1,6 s, 20 daño en área | +1 cohete, +20 % área |
| Rayuela | Lanza el tejo en línea recta hacia donde caminas, atraviesa todo | 30 daño cada 1,8 s | +1 tejo en abanico, +20 % daño |
| ¡GUAU! | El ladrido; siempre equipado, no ocupa espacio | 30 daño, enfriamiento 6 s | +25 % daño y área, −0,6 s enfriamiento |

### Rasgos (pasivas) — máximo 4 a la vez

| Rasgo | Efecto por nivel (hasta 5) | Texto de la carta |
| --- | --- | --- |
| Pata de perro | +8 % velocidad | "No para en la casa" |
| Chalequito | +1 armadura | "Tejido por la vecina" |
| La once | +20 vida máxima y +0,3 vida/s | "Tecito y marraqueta" |
| Cachai | +10 % área y radio de órbita | "Lo ve todo" |
| Choro | +10 % daño | "No le tiene miedo a na'" |
| La jauría | +1 proyectil en nv 2 y 4 para todas las armas | "Llegaron los del barrio" |
| Al tiro | −8 % enfriamientos | "Altiro, altiro" |
| Olfato | +25 % radio de recolección | "Huele un completo a tres cuadras" |

### Evoluciones

Un arma en nivel 5 más su rasgo pareja (cualquier nivel) evoluciona la próxima vez que abres una Caja del Almacén. Cada evolución cambia la pantalla de forma visible: es el momento que la gente graba.

| Arma + Rasgo | Evolución | Qué cambia |
| --- | --- | --- |
| Volantín + La once | Cielo del Dieciocho | 8 volantines de colores que dejan estela y curan 1 vida por enemigo cortado |
| Trompo + La jauría | Trompo Tornado | Trompos gigantes que arrastran enemigos en espiral |
| Maraña de cables + Cachai | Apagón | La pantalla se oscurece un instante y caen rayos a todo lo visible |
| Chaya + Chalequito | Carnaval | Estela ancha que detiene a los enemigos chicos y te da escudo al pisarla |
| Fuegos artificiales + Choro | Año Nuevo en Valpo | Cada explosión lanza 3 cohetes más (reacción en cadena) y suena la cuenta regresiva |
| Rayuela + Pata de perro | Persigue autos | Al correr te lanzas como bala, invulnerable durante la embestida |
| ¡GUAU! + Al tiro | Aullido de las 12 | Si cargas el ladrido completo no tiene enfriamiento, y todos los perros del mapa aullan contigo |

### Experiencia, niveles y objetos

- Los enemigos sueltan comida que da experiencia: **sopaipilla** 1 XP, **completo** 5 XP, **chorrillana** 25 XP. Con más de 300 en el suelo, las nuevas se fusionan para no perder rendimiento.
- XP para el siguiente nivel: `5 + nivel × 10 + nivel² × 0,6` (redondeado).
- Al subir: cámara lenta 0,3× durante 0,4 s, cartel "¡Wena!", luego pausa con **3 cartas** (4 con mejora de la Cucha). Botones: Otra mano (volver a tirar, 2 por partida al inicio), Ni ahí (desterrar la opción) y Paso (+5 lucas).
- Rareza: común 70 %, rara 22 % (×1,5 del efecto), épica 7 % (×2), legendaria "¡Bacán!" 1 % (×3, borde dorado). La Buena onda de la Cucha mueve estos porcentajes.
- **Caja del Almacén:** la sueltan los élites y los jefes. Al tocarla se abre con una ruleta de 2,5 s que entrega 1, 3 o 5 mejoras (70/25/5 %). Si hay evolución disponible, sale primero.
- Objetos raros en el suelo: **Mote con huesillo** (cura 30), **Silbido de la vecina** (atrae toda la comida), **¡Temblor!** (sacude la pantalla y destruye a todos los enemigos normales; aparece el cartel "Fue un 6,2. Nadie se movió").

## Enemigos, jefes y dificultad

Cada zona de Chile trae 2 a 4 enemigos propios, un peligro del entorno y un jefe; la dificultad sube con el tiempo, no por niveles, para que cada minuto se sienta más intenso.

### Zonas y kilómetros

Los kilómetros avanzan con el tiempo sobrevivido (unos 358 km por minuto), de modo que el minuto 12 equivale a llegar a Punta Arenas.

| Zona | Minutos | Km | Escenario | Peligro del entorno | Jefe |
| --- | --- | --- | --- | --- | --- |
| Norte | 0–3 | 0–1.075 | Desierto de Atacama, salitreras, cerros rojos, desierto florido al final | Remolinos de polvo que empujan | El Alicanto |
| Centro | 3–6 | 1.075–2.150 | Santiago (cables, micros, palomas, cordillera al fondo) y Valparaíso (cerros de colores, ascensores) | La micro que no para cruza la pantalla en línea recta | El Taco |
| Sur | 6–9 | 2.150–3.225 | Bosque valdiviano, volcanes, lluvia, Chiloé con palafitos e iglesias de madera | Neblina chilota que reduce la visión | El Caleuche |
| Patagonia | 9–12 | 3.225–4.300 | Glaciares, Torres del Paine, estepa con viento | Viento patagónico que desvía proyectiles y empuja | El Gran Temblor |
| La Antártica | 12+ | 4.300+ | Hielo infinito, auroras | Todos los anteriores, rotando | Jefes anteriores mejorados cada 3 min |

### Enemigos

| Enemigo | Zona | Comportamiento | Vida | Velocidad (px/s) | Daño | Suelta |
| --- | --- | --- | --- | --- | --- | --- |
| Zancudo | Norte | Enjambre que va directo hacia ti, zumbido molesto | 6 | 120 | 5 | Sopaipilla |
| Jote | Norte | Vuela en círculos y se lanza en picada cada 4 s (aviso con sombra) | 18 | 90 / 340 en picada | 10 | Sopaipilla |
| Guanaco | Norte | Se detiene a distancia y escupe (proyectil lento) | 26 | 70 | 8 por escupo | Completo |
| Paloma de la Plaza | Centro | Bandadas de 8 a 15 que se mueven juntas | 10 | 140 | 6 | Sopaipilla |
| Micro | Centro | Se alinea, toca la bocina 0,8 s y embiste en línea recta sin frenar; atropella también a otros enemigos | 60 | 40 / 420 al embestir | 18 | Completo |
| Gaviota de Valpo | Centro | Roba la comida del suelo y huye; si la matas suelta todo lo robado | 20 | 160 | 4 | Lo robado |
| Lobo marino | Centro | Tanque lento, se tira encima y aplasta en área | 140 | 45 | 20 | Chorrillana |
| Chonchón | Sur | Cabeza voladora de la mitología que avanza en ondas; grita "tue tue" | 22 | 130 | 8 | Sopaipilla |
| Camahueto | Sur | Ternero de un cuerno que carga en línea y rompe tus trompos | 80 | 60 / 360 en carga | 16 | Completo |
| Basilisco chilote | Sur | Gallo serpiente; su mirada te ralentiza 30 % si lo miras de frente 1 s | 50 | 75 | 10 | Completo |
| Témpano | Patagonia | Bloque de hielo que al morir se parte en 3 trozos chicos | 120 | 40 | 14 | Chorrillana |
| Chingue | Patagonia | Corre en zigzag y al morir deja una nube tóxica 3 s | 35 | 150 | 8 + nube | Completo |

**Élites:** cualquier enemigo puede salir élite (borde dorado, ×5 vida, ×1,3 tamaño); uno cada 60 s y siempre suelta una Caja del Almacén. El élite de Patagonia es el **Puma**, que acecha fuera de cámara y salta.

### Jefes

Cada jefe tiene una presentación de 2 s (barra de vida que se llena, nombre grande en pantalla, música que cambia) y 2 fases. Al vencerlo: cámara lenta, lluvia de comida y Caja del Almacén dorada.

| Jefe | Zona | Fase 1 | Fase 2 (bajo 50 % de vida) | Vida base |
| --- | --- | --- | --- | --- |
| El Alicanto | Norte | Pájaro de alas metálicas que brilla; dispara abanicos de plumas de oro y plata | Se vuelve invisible salvo sus ojos y deja rastros de pepitas que explotan | 1.500 |
| El Taco | Centro | Culebra de 12 autos y micros que persigue tocando bocina; cada bocinazo es un cono de daño | Los autos de la cola se sueltan y se convierten en micros que embisten | 4.000 |
| El Caleuche | Sur | Barco fantasma que navega en círculos sobre la neblina y dispara cañonazos con aviso | Toca música de fiesta, invoca chonchones y la neblina tapa la mitad de la pantalla | 8.000 |
| El Gran Temblor | Patagonia (final) | Titán de roca que golpea el suelo: grietas en línea y caída de piedras | Réplicas: la pantalla se sacude cada 5 s y aparecen grietas en cruz; el jugador debe mantenerse "sin moverse" en zonas seguras marcadas | 15.000 |

### Curva de dificultad

Con `t` en minutos desde el inicio del viaje:

- **Aparición de enemigos por segundo:** `1,5 + 0,6·t + 0,05·t²` (unos 1,5 al inicio, 9 en el minuto 9, 16 en el minuto 15).
- **Multiplicador de vida:** `1 + 0,15·t + 0,02·t²`. El daño enemigo sube más lento: `1 + 0,08·t`.
- **Límite en pantalla:** 300 enemigos en escritorio, 180 en celular. Si se llega al límite, los más lejanos se reciclan delante del jugador.
- **Oleadas especiales:** en los minutos 2, 5, 8 y 11 un anillo de enemigos rodea al jugador ("¡Te rodearon!"), que es el momento ideal para el ¡GUAU!.
- **Evento Temblor:** una vez por partida, al azar entre los minutos 4 y 10, la pantalla tiembla 2 s, todos los enemigos se detienen asustados y el quiltro sigue tranquilo. Logro: "Ni se inmutó".
- Objetivo de balance: un jugador nuevo muere entre el minuto 4 y 7 en su primera partida; con unas 10 partidas de mejoras en la Cucha, vence al Gran Temblor.

## Meta incremental: La Cucha

La Cucha es la casa del quiltro y el centro de la progresión permanente: ahí se gastan las **lucas** ganadas en cada viaje y ahí los vecinos dejan comida aunque no juegues, que es el gancho incremental para volver cada día.

### Lucas

- Al terminar un viaje: `lucas = km / 20 + enemigos / 30 + 50 por jefe vencido`, multiplicado por la mejora Cuenta RUT.
- Primera vez que llegas a una zona nueva: +100 lucas y una animación del mapa de Chile que se ilumina hasta ese punto.
- La pantalla final muestra las lucas contando hacia arriba con sonido de monedas; si se compra algo con lo ganado, el botón de la Cucha brilla.

### Mejoras permanentes

Cada mejora cuesta `costo base × 1,6^nivel` (redondeado a 5). Se muestran como objetos dentro de la Cucha dibujada, no como lista: el plato, la frazada, la pelota, etc.

| Mejora | Objeto en la Cucha | Efecto por nivel | Niveles | Costo base |
| --- | --- | --- | --- | --- |
| Plato lleno | Plato de comida | +10 vida máxima | 5 | 40 |
| Frazada | Frazada a cuadros | +1 armadura | 3 | 120 |
| Pelota | Pelota mordida | +5 % velocidad | 5 | 50 |
| Hueso de caracú | Hueso | +6 % daño | 5 | 60 |
| Nariz húmeda | Nariz en un cuadro | +15 % olfato | 3 | 40 |
| Collar nuevo | Collar colgado | −5 % enfriamientos | 3 | 150 |
| Volantín extra | Volantín en la pared | +1 volantín inicial | 2 | 300 |
| Buena onda | Herradura | +suerte (más cartas raras) | 5 | 80 |
| Otra mano | Naipe | +1 volver a tirar por partida | 3 | 100 |
| Cuarta carta | Mesita | 4 cartas al subir de nivel | 1 | 600 |
| Segunda vida | Medalla de la vecina | Revives una vez con 50 % de vida | 1 | 800 |
| Cuenta RUT | Alcancía de chanchito | +10 % lucas por viaje | 5 | 100 |

### Los vecinos (idle)

- Mientras no juegas, los vecinos dejan comida que se convierte en lucas: 10 lucas por hora al inicio, hasta 8 horas acumuladas.
- Se mejora "haciéndote amigo" de más vecinos con lucas: la señora del almacén, el conserje, el de la feria, la tía de la once. Cada uno suma producción y aparece dibujado en la calle de la Cucha.
- Al volver, un cartel: "Mientras no estabas, la señora del almacén te dejó 85 lucas" con botón Recoger.
- Importante: el idle complementa, no reemplaza jugar. Nunca produce más del 30 % de lo que da un buen viaje.

### Personajes desbloqueables

| Personaje | Cómo se desbloquea | Arma inicial | Rasgo propio |
| --- | --- | --- | --- |
| El Quiltro | Desde el inicio | Volantín | Ninguno, equilibrado |
| La Quiltra del Chalequito | Llegar a Santiago | Volantín | Empieza con Chalequito nv 2, −10 % velocidad |
| El Gato del Almacén | Recoger 5.000 sopaipillas en total | Maraña de cables | +15 % crítico, 70 de vida |
| El Pudú | Llegar a Chiloé | Rayuela | El más rápido (+25 %), más chico (cuesta acertarle) |
| El Pingüino de Humboldt | Vencer al Caleuche | Chaya | Desliza al moverse, +30 % área |
| La Paloma Rebelde | Matar 10.000 palomas en total | Fuegos artificiales | Vuela sobre peligros del entorno |

### Logros (muestra)

Ni se inmutó (sobrevivir un Temblor sin moverte) · La micro sí paró (matar una micro antes de que embista) · Dieciochero (tener Cielo del Dieciocho) · De Arica a Punta Arenas (vencer al Gran Temblor) · Puro aguante (sobrevivir 5 min sin recibir daño) · Pa' la foto (llegar a 300 enemigos en pantalla) · Guardianes (logro secreto: encontrar la ruta a Rapa Nui en La Antártica, donde los moais te saludan). Cada logro da lucas y una pañoleta de color para el quiltro.

### Ruta del día

- Un viaje con semilla fija por fecha: mismos enemigos, mismas cartas para todos. Un intento por día que cuenta; se puede repetir sin puntuar.
- Al terminar, botón **Copiar para el grupo** con un texto así:

```
QUILTRO · Ruta del día #47
🐕 Llegué a Chiloé · 2.980 km
🟨🟨🟨🟦🟦🟦🟩🟩⬜⬜⬜⬜
🪁 Cielo del Dieciocho
¿Llegai más lejos? <link del juego>
```

- Cada cuadro es un minuto: amarillo Norte, azul Centro, verde Sur, blanco Patagonia; los cuadros grises no se alcanzaron. (Los emojis van solo en este texto para compartir, no en la interfaz.)
- Además se genera una tarjeta imagen 1080×1920 para historias de Instagram y TikTok con el mapa de Chile, el recorrido y el build.

## Dirección de arte

El estilo es **pixel art 2D a lo Vampire Survivors, con la claridad y el encanto de los personajes de Brotato**: sprites pequeños y muy legibles, personajes con mucha personalidad en pocos píxeles, pantalla que se llena de caos y números, y un Chile reconocible en cada zona. Debe verse como un indie premium hecho a mano, no como un prototipo.

### Qué tomamos de cada referente

| De Vampire Survivors | De Brotato | Propio de QUILTRO |
| --- | --- | --- |
| Pixel art, cámara cenital, hordas enormes, números de daño, cofres con ruleta | Personajes simpáticos con siluetas gruesas, contorno oscuro de 1 px, colores alegres, lectura clara en el caos | Paisajes chilenos con parallax, clima por zona, objetos y animales de Chile |

### Resolución y cámara

- **Resolución nativa 480×270** (16:9), escalada siempre por un número entero (×2, ×3, ×4) con filtro de vecino más cercano, para que los píxeles queden nítidos y cuadrados. Si sobra espacio, bordes con un marco decorativo de la zona, nunca píxeles estirados.
- En celular vertical la resolución nativa pasa a 270×480.
- Vista cenital (como Vampire Survivors). Los objetos altos (postes, cactus, araucarias) se ordenan por su posición vertical para que el quiltro pase por detrás.
- Cámara que sigue al quiltro con suavizado y se adelanta un poco hacia donde camina; su posición final se redondea a píxeles enteros para que no tiemble. Al dar hilo se aleja un nivel de zoom (×3 a ×2 según la pantalla).

### Tamaños de sprites

| Tipo | Tamaño | Cuadros de animación |
| --- | --- | --- |
| Quiltro y personajes jugables | 24×24 | Quieto 2, trotar 4, cargar GUAU 2, ladrar 3, daño 1, muerte 4 |
| Enemigos chicos (zancudo, paloma) | 12×12 a 16×16 | Moverse 2 a 4 |
| Enemigos medianos (micro, guanaco, lobo marino) | 24×24 a 32×24 | Moverse 4, ataque 2 a 3 |
| Élites | Mismo sprite con borde dorado de 1 px | — |
| Jefes | 64×64 a 128×96 (El Taco es por segmentos de 32×24) | Moverse 4, ataque 4, fase 2 con cambio de colores |
| Armas y proyectiles | 8×8 a 16×16 | 2 a 4 (volantín ondeando, trompo girando) |
| Comida | 8×8 a 12×12 | 2 (brillo) |
| Baldosas de suelo | 16×16 | Variantes de 4 a 8 por zona |
| Objetos decorativos | 16×16 a 32×48 | 1 a 2 (cables que se mecen) |
| Íconos de cartas | 16×16 dibujados a ×2 | — |

### Paleta

Una paleta fija de 32 colores para todo el juego, construida a partir de estos colores base (Claude Code completa las sombras y luces de cada uno y la documenta en `src/art/palette.ts`):

| Uso | Nombre | Color |
| --- | --- | --- |
| Contorno de todo | Tinta | #2A2233 |
| Quiltro | Caramelo | #E8A15C |
| Pañoleta, UI principal | Azul cielo | #2F7DE1 |
| Peligro, daño, enemigos | Rojo copihue | #E63946 |
| Paneles y texto claro | Marraqueta | #FBF3E4 |
| Norte | Ocre desierto | #E9A35B |
| Centro (Valpo) | Fachadas pastel | #FF8FAB, #FFD166, #6AD5C9 |
| Sur | Bosque valdiviano | #2D6A4F |
| Patagonia | Glaciar | #A8E6F0 |
| Experiencia y logros | Dorado sopaipilla | #F4B942 |

Reglas de lectura: el quiltro siempre es lo más claro y saturado de la pantalla; los proyectiles enemigos son rojo copihue con un píxel blanco al centro; la comida parpadea con un brillo de 1 píxel; el suelo usa colores apagados para que todo lo que se mueve resalte.

### Cómo se crean los gráficos

- **Sprites hechos por Claude Code como matrices de píxeles en código** (cada fila es un texto donde cada letra es un color de la paleta). Un script de build los convierte en una hoja de sprites PNG con su archivo JSON. Así todo usa la misma paleta, se puede corregir píxel a píxel y después se pueden reemplazar por arte hecho en Aseprite sin tocar el juego.
- Claude Code debe generar una **página de vista previa** (`/sprites.html`) que muestre cada sprite animado a ×4 sobre los suelos de cada zona, para revisar el arte antes de usarlo.
- **Canva: arte promocional.** Logo, portada, miniaturas para TikTok y YouTube y banner de itch.io, en el mismo estilo pixel.
- **Fondos:** suelo de baldosas de 16×16 con variaciones, objetos decorativos repartidos de forma procedural y 2 capas lejanas con parallax (cordillera, mar, volcanes, glaciares).

### Elementos por zona

| Zona | Suelo | Decoración en el mapa | Fondo lejano | Clima |
| --- | --- | --- | --- | --- |
| Norte | Arena y tierra roja | Cactus candelabro, ruinas de salitrera, rieles, flores del desierto florido | Cerros rojos y cielo estrellado | Polvo en suspensión |
| Centro | Pastelones y adoquines | Postes con maraña de cables, quioscos, carro de sopaipillas, escaleras y ascensores de Valpo | Cordillera nevada, luego el mar | Smog suave, gaviotas |
| Sur | Pasto y barro | Araucarias, copihues, tejuelas, palafitos, iglesias de madera | Volcanes con nieve | Lluvia en píxeles diagonales y neblina con tramado (dithering) |
| Patagonia | Nieve y estepa | Coirón, cercos de alambre, hielo azul, guanacos de fondo | Torres de granito y glaciar | Viento con copos de nieve horizontales |

### Animación en pixel art

- Todo se anima por cuadros a 8 a 12 cuadros por segundo; nada se escala ni se rota de forma suave salvo los efectos de la tabla de juice (así no se "rompen" los píxeles).
- **Quiltro:** trote de 4 cuadros con rebote de 1 píxel, cola que se mueve en el cuadro quieto, orejas que vuelan al correr, pañoleta de 2 cuadros, parpadeo cada 3 a 5 s.
- **Al cargar el ¡GUAU!:** se agacha (2 cuadros) y parpadea el anillo de carga. Al soltar: 3 cuadros de ladrido y un globo de cómic "¡GUAU!" en letras pixel.
- **Enemigos:** al recibir golpe, todo el sprite se pinta blanco 2 cuadros; al morir, "puf" de 6 a 10 píxeles del color del enemigo.
- **Volantines:** sprite de 4 cuadros ondeando, inclinado en 8 direcciones según el giro, y el hilo dibujado como línea de 1 píxel.

### Juice (sensación de impacto)

| Evento | Efecto |
| --- | --- |
| Golpe normal | Enemigo en blanco 2 cuadros, número de daño en letra pixel que salta y cae |
| Crítico | Número más grande en dorado con contorno, pausa de impacto de 40 ms, sacudida leve |
| Muerte de enemigo | Partículas pixel, pequeño empuje a los vecinos, sonido con tono aleatorio |
| Recoger comida | Tintineo que sube de tono con cada pieza seguida (se reinicia a los 1,5 s) |
| ¡GUAU! | Anillo pixel que se expande, sacudida media, 2 cuadros de pantalla en colores invertidos |
| Subir de nivel | Cámara lenta 0,3×, columna de luz pixel, cartel "¡Wena!" |
| Recibir daño | Borde de pantalla rojo 2 cuadros, el quiltro parpadea durante la invulnerabilidad |
| Vida baja (menos de 25 %) | Viñeta roja con tramado que late |
| Jefe muerto | 1 s en cámara lenta, fuegos artificiales pixel, lluvia de comida |

La sacudida usa un modelo de "trauma" (se suma y decae) y se mueve siempre en píxeles enteros de la resolución nativa; todo se puede reducir en Opciones.

### Tipografía

**Pixelify Sans** para toda la interfaz y **Press Start 2P** solo para el logo y números grandes (ambas de Google Fonts, licencia abierta). Verificar que muestren bien ñ, tildes, ¡ y ¿; si alguna falla, Claude Code dibuja una fuente bitmap propia de 5×7 con esos caracteres.

## UX y pantallas

La regla de UX es que desde abrir el enlace hasta estar jugando pasen menos de 5 segundos y un solo toque, y que desde morir hasta la siguiente partida pase un solo toque.

### Flujo de pantallas

1. **Carga (menos de 2 s):** logo QUILTRO con el quiltro moviendo la cola, barra de carga como un volantín que sube, y un dato chileno al azar abajo.
2. **Menú principal:** el quiltro durmiendo frente a su Cucha en una calle de barrio animada (palomas, un volantín enredado en un cable). Al tocar, despierta y estira. Botones grandes tipo sticker: **¡Viajar!** (destacado), Ruta del día, La Cucha, Logros, Opciones. Arriba: lucas y récord de km.
3. **Elegir personaje:** carrusel horizontal con el personaje grande animado, sus estadísticas en barras y el arma inicial. Bloqueados en silueta con la condición para desbloquear.
4. **Mapa de inicio (1,5 s, se puede saltar):** el mapa de Chile vertical con una línea punteada desde Arica, y la marca del récord personal ("Tu récord: Temuco").
5. **Juego (HUD).**
6. **Subida de nivel (cartas).**
7. **Caja del Almacén (ruleta).**
8. **Pausa:** fondo desenfocado, build actual con todas las armas y rasgos con su nivel, estadísticas, botones Seguir, Opciones y Pa' la casa (con confirmación).
9. **Fin del viaje.**
10. **La Cucha, Logros, Opciones.**

### HUD

| Posición | Elemento |
| --- | --- |
| Arriba, ancho completo | Barra de experiencia delgada (dorada) con el nivel a la izquierda |
| Arriba al centro | Kilómetros grandes y el nombre de la ciudad actual (Arica, Antofagasta, Santiago, Temuco, Puerto Montt, Coyhaique, Punta Arenas) |
| Arriba a la izquierda | Vida como barra con un hueso de ícono |
| Arriba a la derecha | Tiempo, contador de enemigos derrotados y botón de pausa |
| Borde derecho | Mini mapa de Chile vertical con el puntito del quiltro bajando |
| Abajo a la izquierda | Íconos de armas y rasgos con su nivel en puntos |
| Sobre el quiltro | Anillo de carga del ¡GUAU! y pequeña barra de enfriamiento |
| Al aparecer un jefe | Barra de vida grande abajo con su nombre |

El HUD ocupa como máximo el 12 % de la pantalla y nunca tapa el centro.

### Cartas de subida de nivel

- 3 cartas grandes tipo naipe que entran desde abajo con un pequeño rebote y una diferencia de 80 ms entre cada una.
- Cada carta: ícono grande ilustrado, nombre, "Nuevo" o "Nivel 3 → 4", efecto en una línea con el número exacto, y el texto chileno de la carta en pequeño. El borde indica rareza (gris, azul, morado, dorado).
- Si una carta completa una evolución, muestra un sello "¡Evoluciona!" con el ícono de la pareja.
- Selección con toque, clic, teclas 1-2-3 o mando. Durante los primeros 0,4 s no se puede elegir, para evitar toques accidentales.

### Fin del viaje

- Título grande según el resultado: muerte "**Se te fue la micro**"; jefe final vencido "**¡De Arica a Punta Arenas!**".
- Mapa de Chile con la línea recorrida animada hasta donde llegaste, km y ciudad, y "Nuevo récord" si corresponde.
- Estadísticas: tiempo, enemigos, nivel, daño por arma (barras), lucas ganadas contando.
- Botones: **¡Otra, al tiro!** (grande, tecla R), La Cucha, Compartir y Menú.
- Si con las lucas ganadas alcanza para una mejora, aparece un aviso: "Te alcanza para el Hueso de caracú".

### Tutorial (primer viaje, sin pantallas de texto)

1. Segundo 0: una mano animada sobre el joystick o las teclas WASD con "Muévete". Desaparece al moverse 1 s.
2. Segundo 5: aparecen 6 zancudos lentos; los volantines los cortan solos. Texto: "Tus volantines atacan solos".
3. Al juntar la primera comida: "Junta comida para subir de nivel".
4. Primera subida de nivel: las cartas ya se explican solas; solo un brillo sobre la primera.
5. Minuto 1: llega un grupo grande alrededor. "Mantén para dar hilo, suelta para ¡GUAU!" con la animación del botón. Este grupo no hace daño hasta que se usa el ladrido una vez.
6. Cada consejo aparece una sola vez y se puede desactivar en Opciones.

### Opciones

Volumen de música y efectos · Sacudida de pantalla (0–100 %) · Números de daño sí/no · Reducir destellos (para fotosensibilidad) · Modo daltonismo (cambia rojo/verde por formas e íconos) · Mantener o alternar para dar hilo · Joystick fijo o flotante · Calidad gráfica (auto, alta, baja) · Idioma (español de Chile por defecto; español neutro e inglés después) · Borrar progreso (con confirmación doble).

### Celular

- Funciona en vertical y horizontal; en vertical el HUD se reorganiza y las cartas se apilan.
- Botones de al menos 48 px, zona del pulgar libre, y vibración corta en el ¡GUAU! y al recibir daño (si el dispositivo lo permite).
- Pausa automática al cambiar de pestaña o bloquear la pantalla.
- Instalable como app (PWA) con ícono del quiltro y funcionamiento sin conexión.

## Sonido y música

El sonido tiene sabor chileno sin depender de canciones con derechos: música original con instrumentos y ritmos reconocibles (cumbia, cueca, guitarra y charango) y efectos que suenan bien aunque haya 300 enemigos.

### Música

- **Fuente:** compuesta en código con Tone.js usando instrumentos de bancos de sonido libres (SoundFont con licencia abierta) o, si se prefiere, pistas sin derechos con licencia CC0 que Claude Code descarga y documenta.
- **Capas por intensidad:** cada zona tiene una pista con 3 capas (base, ritmo, melodía) que se suman según la cantidad de enemigos en pantalla. Cambio de zona con transición de 2 s.
- **Estilo por zona:** Norte con charango y bombo, lento y misterioso · Centro con cumbia de acordeón y bajo, alegre y rápida · Sur con guitarra y lluvia, melancólica · Patagonia con cuerdas y viento, épica · jefes con la misma base y percusión fuerte.
- **Evolución Cielo del Dieciocho:** durante 20 s la música cambia a un ritmo de cueca en 6/8 con palmas.
- Menú principal: guitarra tranquila con sonido ambiente de barrio (perros lejanos, una micro, pájaros).

### Efectos

| Evento | Sonido | Nota técnica |
| --- | --- | --- |
| ¡GUAU! | Ladrido real con eco corto | Muestra de dominio público (CC0); variación de tono ±5 % |
| Golpe del volantín | "Fsst" de papel cortando | Generado por código (ruido filtrado), máximo 8 a la vez |
| Enemigo muere | "Puf" corto | Tono aleatorio para evitar repetición |
| Recoger comida | Tintineo | Sube un semitono por pieza seguida, escala pentatónica |
| Subir de nivel | Rasgueo de guitarra ascendente |  |
| Carta legendaria | Acordeón alegre corto + "¡Bacán!" |  |
| Micro | Bocina de micro y motor | Aviso 0,8 s antes de embestir |
| Paloma | Aleteo en grupo | Uno por bandada, no por paloma |
| Temblor | Retumbo grave y vidrios | Junto a la sacudida |
| Caja del Almacén | Campanita de almacén y ruleta |  |
| Recibir daño | Gemido corto del quiltro | Nunca más de 1 cada 0,3 s |

### Mezcla

Máximo 24 sonidos a la vez con prioridad (jugador y jefe primero). Los sonidos repetidos dentro de 30 ms se agrupan en uno. Los efectos se agachan 30 % cuando habla un cartel importante o aparece un jefe.

## Guion y textos del juego

La historia cabe en tres viñetas y se cuenta sin leer: el viento del Dieciocho se lleva el volantín de la Martina, la niña del barrio, y el quiltro decide ir a buscarlo hasta el fin de Chile. El tono es tierno y chistoso, nunca triste ni polémico.

### Intro (3 viñetas tipo cómic, 2 s cada una, se pueden saltar)

1. Arica, 18 de septiembre. La Martina eleva su volantín azul; el quiltro mira con la cola moviendo. Texto: "Arica. Dieciocho."
2. Un tirón de viento corta el hilo y el volantín se va volando hacia el sur. La Martina llora. Texto: "¡Nooo, mi volantín!"
3. El quiltro se acomoda la pañoleta y mira el horizonte. La tierra tiembla un poquito; nadie se mueve. Texto: "Yo lo traigo."

Cada viaje el volantín azul aparece a lo lejos en el fondo, siempre un poco más al sur.

### Entrada a cada zona (cartel grande 2 s)

| Zona | Título | Subtítulo |
| --- | --- | --- |
| Norte | EL NORTE GRANDE | "Aquí no llueve nunca. Pero zancudos hay." |
| Centro | SANTIAGO | "Cuidado: la micro no para." |
| Centro (mitad) | VALPARAÍSO | "Puros cerros. Y gaviotas con hambre." |
| Sur | EL SUR | "Llueve. Y dicen que hay un barco fantasma." |
| Patagonia | LA PATAGONIA | "Aquí el viento manda." |
| Modo infinito | LA ANTÁRTICA | "Más al sur ya no queda Chile. ¿O sí?" |

### Jefes (línea al aparecer, debajo del nombre)

- **El Alicanto:** "Dicen que quien lo sigue encuentra oro. O se pierde para siempre."
- **El Taco:** "Costanera, 18:30 horas."
- **El Caleuche:** "Se escucha música de fiesta en medio del mar..."
- **El Gran Temblor:** "Este sí es grado 9. Ahora sí hay que moverse."

### Final (vencer al Gran Temblor)

1. El volantín azul baja lento desde el cielo de Punta Arenas y cae junto al quiltro.
2. El quiltro lo toma con el hocico, se da vuelta y mira el mapa: 4.300 km de vuelta. Texto: "..."
3. Corte a Arica: la Martina abre la puerta y está el quiltro, flaco, con el volantín. Texto: "¡VOLVISTE!"
4. Cartel final: "De Arica a Punta Arenas. Y de vuelta. Puro aguante." Se desbloquea La Antártica.

### Textos de interfaz

| Dónde | Texto |
| --- | --- |
| Botón jugar | ¡Viajar! |
| Subir de nivel (al azar) | ¡Wena! · ¡Vamos que se puede! · ¡Esa! · ¡Buena, cabro! |
| Carta legendaria | ¡Bacán! |
| Volver a tirar | Otra mano |
| Desterrar | Ni ahí |
| Saltar | Paso |
| Pausa | Pausa pa'l tecito |
| Salir | Pa' la casa |
| Muerte | Se te fue la micro |
| Reintentar | ¡Otra, al tiro! |
| Rodeado | ¡Te rodearon! |
| Temblor | Fue un 6,2. Nadie se movió. |
| Nuevo récord | ¡Llegaste más lejos que nunca! |
| Vecinos idle | Mientras no estabas, {vecino} te dejó {n} lucas |
| Sin lucas suficientes | Te faltan {n} lucas, compadre |

### Datos en la pantalla de carga (al azar)

- Chile mide más de 4.000 km de largo y en promedio unos 177 km de ancho.
- El desierto de Atacama es el desierto no polar más seco del mundo.
- El pudú es uno de los ciervos más pequeños del mundo y vive en el sur de Chile.
- Las iglesias de madera de Chiloé son Patrimonio de la Humanidad.
- Consejo: la micro también atropella a tus enemigos. Úsala.
- Consejo: si una gaviota te roba la comida, persigue a la gaviota.
- Consejo: dar hilo es poderoso, pero te pone lento.

Todos los textos viven en un archivo de idioma (`es-CL.json`) para poder traducir después; los datos reales deben verificarse antes de publicar.

## Arquitectura técnica

El juego es una web en TypeScript con PixiJS (WebGL), publicada en GitHub Pages como RASCENSO, pero con una base más profesional: tipado, pruebas, contenido en archivos de datos y un panel de depuración desde el primer día.

### Tecnologías

| Pieza | Elección | Por qué |
| --- | --- | --- |
| Lenguaje | TypeScript estricto | Menos errores en un proyecto que crecerá |
| Construcción | Vite | Arranque instantáneo y build optimizado |
| Gráficos | PixiJS v8 | Dibuja miles de sprites a 60 fps; se configura en modo pixel (vecino más cercano, píxeles redondeados, escala entera) |
| Música | Tone.js | Música en capas y generada por código |
| Efectos de sonido | Web Audio propio | Control fino de prioridades y tonos |
| Interfaz de menús | PixiJS a resolución nativa, con paneles pixel de 9 partes | Menús y juego en el mismo pixel art, con fuente pixel |
| Pruebas | Vitest | Probar fórmulas de balance, guardado y semillas |
| App instalable | vite-plugin-pwa | Funciona sin conexión y se instala en el celular |
| Publicación | GitHub Actions a GitHub Pages | Cada push a main publica solo |

### Estructura de carpetas

```
quiltro/
  index.html
  public/            íconos, manifest, sonidos CC0, LICENSES.md
  src/
    main.ts          arranque y bucle principal
    core/            loop de paso fijo, escenas, input, cámara, rng con semilla, eventos
    game/
      systems/       movimiento, spawn, colisiones (grilla espacial), armas, daño, recolección, jefes
      entities/      jugador, enemigos (pools), proyectiles, comida, partículas
      world/         zonas, suelo, decoración procedural, clima, parallax
    data/            armas.ts, rasgos.ts, enemigos.ts, jefes.ts, zonas.ts, cucha.ts, logros.ts
    art/             paleta, sprites como matrices de píxeles y script que arma la hoja de sprites
    audio/           sfx.ts, music.ts
    ui/              menú, HUD, cartas, caja, pausa, fin, cucha, opciones, tutorial
    meta/            guardado con versiones, lucas, vecinos idle, ruta del día, compartir
    i18n/            es-CL.json
    debug/           panel F1
  tests/
  docs/GDD.md        este documento exportado
```

### Reglas de ingeniería

- **Bucle de paso fijo** a 60 actualizaciones por segundo con interpolación al dibujar; la cámara lenta escala el tiempo de juego, no los cuadros.
- **Enemigos y proyectiles en pools** (arreglos reutilizados, sin crear objetos por cuadro) y colisiones con **grilla espacial** de celdas de 64 px.
- **Todo el contenido en `src/data/`:** agregar un enemigo o un arma no debe requerir tocar los sistemas. Los números de este documento son los valores iniciales de esos archivos.
- **Aleatoriedad con semilla** (mulberry32): la Ruta del día usa la fecha como semilla y debe dar exactamente el mismo viaje en todos los dispositivos.
- **Guardado versionado** en localStorage con migraciones, copia de respaldo y exportar/importar como texto en Opciones.
- **Panel de depuración (F1):** fps, cantidad de entidades, tasa de aparición, invencible, dar arma o rasgo, saltar al minuto X, invocar jefe.
- **Presupuesto de rendimiento:** 60 fps con 300 enemigos en un Android de gama media de 2021; carga inicial bajo 3 MB; primer cuadro jugable en menos de 3 s con 4G.
- **Licencias:** todo recurso descargado (sonidos, fuentes, SoundFonts) se registra en `public/LICENSES.md` con su licencia y fuente.

## Plan de construcción

Se construye en 8 fases y no se pasa a la siguiente hasta cumplir su criterio de salida; la fase 1 (que se sienta bien) es la más importante y la que falló en el juego de Unity.

1. **Fase 0 — Base del proyecto.** Vite, TypeScript, PixiJS, ESLint, Vitest, GitHub Actions publicando en Pages, panel F1 vacío, render pixel a 480×270 con escala entera y la página /sprites.html para revisar el arte.
   - Sale cuando: el enlace público muestra un canvas a 60 fps en celular y escritorio.
2. **Fase 1 — Que se sienta bien.** Quiltro con animación completa, movimiento con inercia suave, volantines con hilo, dar hilo, ¡GUAU!, zancudos y palomas, todo el juice de la tabla y sonidos básicos. Suelo del Centro con decoración.
   - Sale cuando: moverse y matar zancudos 60 s ya es entretenido sin ninguna mejora. Grabar un clip de 15 s y que se vea como un juego terminado.
3. **Fase 2 — La partida.** Comida y experiencia, subida de nivel con cartas, las 6 armas y 8 rasgos, curva de dificultad, élites, Caja del Almacén, muerte y pantalla de fin con "¡Otra, al tiro!".
   - Sale cuando: una partida de 10 minutos es completa y dan ganas de jugar otra.
4. **Fase 3 — Chile completo.** Las 4 zonas con su suelo, decoración, parallax, clima y peligro; los 12 enemigos; los 4 jefes con 2 fases; las 7 evoluciones; el evento Temblor; La Antártica.
   - Sale cuando: un viaje completo de Arica a Punta Arenas se puede jugar y vencer usando el panel F1.
5. **Fase 4 — Meta incremental.** Lucas, La Cucha dibujada con sus 12 mejoras, vecinos idle, 6 personajes, logros y guardado con versiones.
   - Sale cuando: tras 10 partidas de prueba simuladas, el jugador llega al jefe final (objetivo de balance).
6. **Fase 5 — Interfaz y onboarding.** Carga, menú animado, selección de personaje, mapa de inicio, HUD final, pausa, opciones completas, tutorial sin texto, intro y final en viñetas, controles táctiles y de mando.
   - Sale cuando: una persona que nunca lo vio entiende cómo jugar en 30 s sin ayuda.
7. **Fase 6 — Sonido.** Música por zona en capas, todos los efectos de la tabla, mezcla con prioridades.
   - Sale cuando: jugar sin mirar la pantalla permite saber qué pasa (jefe, micro, temblor).
8. **Fase 7 — Lo viral.** Ruta del día con semilla, texto para copiar, tarjeta imagen para historias, PWA instalable, arte promocional en Canva (logo, portada, miniaturas).
   - Sale cuando: el texto de la Ruta del día es idéntico en dos dispositivos distintos el mismo día.
9. **Fase 8 — Pulido y lanzamiento.** Balance con datos de prueba, rendimiento en celular, accesibilidad, revisión de textos y licencias, página en itch.io.
   - Sale cuando: 60 fps con 300 enemigos en celular de gama media y cero errores en la consola durante 3 viajes completos.

### Criterios de calidad "se ve profesional"

- Ningún cuadrado o círculo de prueba en la versión publicada: todo tiene su sprite final.
- Toda acción del jugador tiene respuesta visual y sonora en menos de 100 ms.
- Ninguna pantalla sin animación de entrada y salida; ningún botón sin estado de presionado.
- Mismo estilo de contorno, paleta y tipografía en juego, menús y arte promocional.
- Pixel art perfecto: escala entera siempre, ningún sprite estirado, rotado suave o con borde borroso, y todos los colores dentro de la paleta de 32.
- Sin errores ni avisos en la consola, y sin textos en inglés mezclados en la interfaz.

## Prompt para Claude Code

Para empezar: exporta este documento como Markdown, crea una carpeta vacía llamada `quiltro`, guarda el archivo como `docs/GDD.md` y pega este mensaje en Claude Code. Después de cada fase, pega "Sigue con la fase siguiente".

```
Vas a construir QUILTRO, un roguelite de supervivencia con meta incremental ambientado en Chile.
El documento de diseño completo está en docs/GDD.md: léelo entero antes de escribir código.
Es la fuente de verdad para mecánicas, números, arte, textos y UX.

Cómo trabajar:
- Construye por fases, en el orden de "Plan de construcción". Empieza por la Fase 0 y la Fase 1.
- No pases a la siguiente fase hasta cumplir su criterio de salida. Al terminar cada fase,
  dime qué quedó hecho, cómo probarlo y qué decisiones tomaste que no estaban en el documento.
- Stack: Vite + TypeScript estricto + PixiJS v8 + Tone.js + Vitest, publicado en GitHub Pages
  con GitHub Actions. Sigue la estructura de carpetas y las reglas de ingeniería del documento.
- Todo el contenido (armas, rasgos, enemigos, jefes, zonas, mejoras, logros) va en src/data/
  con los valores del documento. Todos los textos van en src/i18n/es-CL.json.
- Arte: dibuja tú mismo todos los sprites en pixel art (estilo Vampire Survivors, personajes a lo Brotato),
  resolución nativa 480x270 con escala entera, paleta de 32 colores y contorno #2A2233.
  Revisa cada sprite en /sprites.html antes de usarlo. Nada de cuadrados de prueba en lo publicado.
- Sonido: efectos con Web Audio; ladrido y otros sonidos reales solo de fuentes CC0.
  Registra cada recurso descargado en public/LICENSES.md.
- Respeta las "Líneas que no cruzamos": sin personas reales, marcas, símbolos políticos,
  estereotipos de grupos de personas ni alcohol.
- Prioridad absoluta: que se sienta bien jugar (Fase 1). Si algo del documento se siente mal
  al probarlo, propón un ajuste concreto en vez de seguir el número a ciegas.
- Incluye el panel de depuración F1 desde la Fase 0.
- Mantén un CHANGELOG.md y haz commits pequeños por funcionalidad.

Empieza ahora con la Fase 0.
```

Para el arte promocional (Fase 7), pídeme aquí el logo, la portada y las miniaturas en Canva cuando el juego tenga sus sprites finales, así usamos el mismo estilo.
