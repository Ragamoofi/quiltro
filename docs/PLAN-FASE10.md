# Plan de la Fase 10 — Personajes y ambientación de los mapas

Pedido: (A) que los personajes estén balanceados y acordes a su desbloqueo, cada uno con un objeto inicial distinto y pasivas o mejoras únicas, con los sprites arreglados y algunos personajes nuevos; (B) que cada lugar tenga tonos y ambientación propios, con enemigos que correspondan al lugar (hoy Santiago tiene gaviotas y lobos marinos) y mapas más vivos.

Regla de siempre: se mide antes y después con el bot (`docs/BALANCE.md`), y se avanza por tandas.

## 1. Lo que encontré

### Personajes (hoy 6)
| Personaje | Se desbloquea con | Arma inicial | Diferencia real hoy |
| --- | --- | --- | --- |
| Quiltro | desde el inicio | Volantín | ninguna (es la base) |
| Quiltra | llegar a Santiago | **Volantín** (igual que el quiltro) | velocidad ×0,9 y Chalequito nivel 2 |
| Gato | 5.000 sopaipillas | Cables | +15 % crítico, 70 de vida |
| Pudú | llegar a Chiloé | Rayuela | velocidad ×1,25, hitbox ×0,75 |
| Pingüino | vencer al Caleuche | Chaya | área ×1,3, se desliza |
| Paloma rebelde | 10.000 palomas | Fuegos | ignora los peligros del ambiente |

Problemas:
- **La Quiltra empieza con la misma arma** que el Quiltro: casi no hay motivo para elegirla.
- Las ventajas son solo números sueltos. Ninguno tiene una habilidad propia que se note jugando.
- Las condiciones de desbloqueo no siguen un orden de dificultad: se pide más al Gato (5.000 sopaipillas, algo que llega solo) que a la Quiltra, y la Paloma pide 10.000 palomas, que es lo más largo de todo.
- **Sprites:** miré las 6 hojas. Todos salen de la misma plantilla de 24×24 con pocos detalles: el Gato es un gris liso, sin rasgos propios; ninguno tiene un accesorio que lo distinga a primera vista, y los dos "cuerpos" (perros) se parecen entre sí.
- Los personajes no se miden con el bot: el bot siempre juega con el Quiltro base.

### Mapas y ambientación
- La zona **Centro** dura de Santiago (km 1.075) a Temuco (km 2.150) y mezcla sus enemigos: **paloma, micro, gaviota y lobo marino**. Las gaviotas y los lobos marinos son de costa y no tienen nada que hacer en Santiago.
- Cada zona tiene un solo suelo, un horizonte y un clima. Dentro de una zona, la única diferencia entre Santiago y Valparaíso es el hito del horizonte y un prop (agregados en la 9.4).
- El mapa se siente quieto: salvo los enemigos y el clima, nada se mueve por sí solo. No hay vida ambiente.

## 2. Parte A — Personajes

### A.1 Diez personajes, cada uno con arma distinta, pasiva única y desbloqueo en orden
Hay 10 armas de espacio, así que cada personaje parte con una distinta. Orden de desbloqueo de más fácil a más difícil:

| # | Personaje | Se desbloquea | Arma inicial | Pasiva única | Ventaja y costo |
| --- | --- | --- | --- | --- | --- |
| 1 | **Quiltro** | inicio | Volantín | **Aullido de barrio:** ¡GUAU! con 20 % menos de espera | equilibrado |
| 2 | **Quiltra** | llegar a Santiago | **Ronda** | **Cría de la cucha:** cada 25 enemigos caídos cura 5 de vida | +25 de vida y Chalequito 1, velocidad ×0,92 |
| 3 | **Gato** | 3.000 enemigos derrotados (en total) | Cables | **Siete vidas:** una segunda vida gratis por viaje | +15 % crítico, −30 de vida |
| 4 | **Zorro** (nuevo) | llegar a Temuco | **Emboque** | **Astuto:** 12 % menos de espera y 10 % de esquivar un golpe | velocidad ×1,05, −15 de vida |
| 5 | **Pudú** | llegar a Chiloé | Rayuela | **Sigiloso:** hitbox ×0,75 y 12 % de esquivar un golpe | velocidad ×1,2, −35 de vida |
| 6 | **Pingüino** | vencer al Caleuche | Chaya | **Aislado:** inmune a ralentización y al viento | área ×1,25, se desliza (frena tarde) |
| 7 | **Chingue** (nuevo) | 5.000 sopaipillas (en total) | **Elástico** | **Perfume:** los enemigos que se acercan reciben daño por segundo | velocidad ×0,95, −10 de vida |
| 8 | **Cóndor** (nuevo) | vencer al Taco | **Trompo** | **Ojo de cóndor:** radio de recoger comida ×1,6 y ve venir los avisos más temprano | +20 % de daño, −25 de vida, velocidad ×0,9 |
| 9 | **Guanaco** (nuevo) | llegar a Punta Arenas | **Bolitas** | **Lana gruesa:** un escudo cada 30 s | +40 de vida, +1 armadura, velocidad ×0,88 |
| 10 | **Paloma rebelde** | vencer al Vecino Viral | Fuegos | **Vuelo:** ignora los peligros del ambiente y atraviesa las nubes | +0 de vida, −20 % de daño |

Notas:
- El desbloqueo más difícil (vencer al jefe final) queda para el personaje más raro. La Paloma pasa de "10.000 palomas" a vencer al Vecino Viral, que además es un hito de partida.
- Las condiciones usan los totales ya guardados (enemigos, sopaipillas). No hay que migrar la partida: los desbloqueos ya ganados se conservan.
- Las pasivas únicas son mecánicas reales (escudo, esquivar, aura, segunda vida), no solo números.

### A.2 Sprites
Redibujo de los 6 personajes que hay y dibujo de los 4 nuevos (24×24, todas las animaciones: quieto, parpadeo, trotar, cargar, ladrar, daño, muerte, dormir, estirar), cada uno con un rasgo que se reconozca de lejos: el **Gato** con una oreja rota y un cascabel, la **Quiltra** con su chaleco de lana de otro color y el hocico más claro, el **Pudú** con cuernos más visibles, el **Pingüino** con una bufanda, la **Paloma** con un pañuelo en el cuello. Se revisan en la hoja de sprites (`/sprites.html`) antes de dar por buenos.

### A.3 Medición
- El bot aprende a jugar con un personaje elegido (`__quiltroBot.start(skill, runs, seed, minutes, invincible, personaje)`).
- Meta de equilibrio: con el bot medio, 20 viajes por personaje, ninguno por debajo de 70 % ni por encima de 130 % del minuto promedio de muerte del Quiltro. Si alguno se sale, se ajusta su ventaja o su costo.

### Criterio de salida de A
Los 10 personajes se pueden elegir, cada uno con arma y pasiva distintas, los sprites revisados, las condiciones de desbloqueo en orden, y la tabla de equilibrio dentro del rango.

## 3. Parte B — Ambientación de los mapas

### B.1 Enemigos que corresponden al lugar
Cada zona se divide en "ambientes" por kilómetro, con su propia lista de enemigos:

| Ambiente | Km | Enemigos |
| --- | --- | --- |
| Norte desierto | 0–1.075 | zancudo, jote, guanaco (igual) |
| **Santiago** | 1.075–1.600 | paloma, micro, **colectivo** (nuevo: auto veloz que embiste), **rata de plaza** (nuevo: pequeña y rápida en grupos) |
| **Valparaíso y costa** | 1.600–2.150 | paloma, gaviota, lobo marino |
| Araucanía | 2.150–2.700 | chonchón, camahueto, basilisco |
| Lagos y Chiloé | 2.700–3.225 | chonchón, camahueto, **lobo marino** (la costa del sur) |
| Patagonia | 3.225–4.300 | témpano, chingue (igual) |

Se agregan 2 enemigos (colectivo y rata) con sprite, comportamiento propio y nombre. El resto reordena los que ya hay.

### B.2 Tonos y paisaje por ambiente
Cada ambiente cambia: el suelo (baldosa distinta), el color del cielo y de los cerros del horizonte, y un tinte suave de ambiente (por ejemplo, Santiago con un velo gris-beige de smog y cordillera nevada nítida; Valparaíso con cielo azul brillante y mar; Araucanía verde y húmeda; Chiloé gris y con neblina; Patagonia fría y clara). Todo con colores de la paleta de 32.
- Nuevos suelos: asfalto y adoquín de Santiago, pasto de costa de Valparaíso, tierra mojada de Chiloé. Se mide con `npm run contraste`.

### B.3 Vida ambiente (el mapa vivo)
Un sistema de "vida ambiente": cosas que se mueven por sí solas cerca de la cámara, sin dañar ni bloquear:
- **Norte:** matas rodantes, lagartijas, un cóndor que cruza el cielo.
- **Santiago:** autos y micros que pasan por las calles, palomas que despegan, un globo de cumpleaños que sube.
- **Valparaíso:** gaviotas que cruzan, un bote en el mar del fondo, ropa colgada.
- **Sur:** mariposas, hojas que caen, un zorro que mira de lejos.
- **Patagonia:** guanacos pastando que se asustan cuando te acercas, ráfagas de nieve.
- Máximo ~10 elementos a la vez, para no tocar el rendimiento (límite: la medición de CPU por segundo del bot no sube más de 15 %).

### Criterio de salida de B
En cada ambiente se ven los tonos propios y los enemigos que corresponden (ninguna gaviota en Santiago), hay vida ambiente, `npm run contraste` pasa para los suelos nuevos, y el bot no muestra errores ni un salto de CPU.

## 4. Orden de trabajo
1. **10.1** Personajes: datos, pasivas únicas y desbloqueos (sin sprites nuevos todavía).
2. **10.2** Sprites: redibujo de los 6 y dibujo de los 4 nuevos.
3. **10.3** Medición con el bot y ajuste de equilibrio.
4. **10.4** Enemigos por ambiente, incluidos los 2 nuevos.
5. **10.5** Tonos, suelos y paisaje por ambiente.
6. **10.6** Vida ambiente.
7. **10.7** Pasada final, `CHANGELOG`, publicación.

## 5. Decisiones que tomé yo y quizá quieras cambiar
- Los 4 personajes nuevos: Zorro, Chingue, Cóndor y Guanaco (animales de Chile). Si prefieres otros, se cambian.
- La Paloma rebelde pasa a ser el personaje más difícil de desbloquear.
- Las 2 enemigos nuevos de Santiago (colectivo y rata de plaza). La rata es un enemigo genérico de ciudad; si prefieres otra cosa, se cambia.
- Ninguna de estas ideas toca la cara de ninguna persona real ni símbolos, según "Líneas que no cruzamos".

## 6. Riesgos
- 10 personajes con 9 animaciones cada uno son muchos sprites: es el trabajo más largo. Si hay que recortar, primero se recortan las animaciones de "dormir" y "estirar" de los nuevos.
- El bot no distingue bien de habilidad, así que mide el equilibrio **entre personajes** (todos con el mismo bot), no si cada uno es divertido. Eso lo tienes que decidir tú jugando.
