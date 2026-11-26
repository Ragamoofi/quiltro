# QUILTRO: primera revisión y mejoras

**Actualización de la segunda ronda:** el zorro y el capibara aprobados se conservan píxel por píxel; los otros 24 personajes fueron rehechos a 32×32 con colores naturales por especie y movimiento de ocho cuadros. La comparación ahora incluye los 26, usando una copia de la primera ronda como “Antes”. Ver `docs/ELENCO.md`. Las referencias de la primera ronda a “siete personajes” describen esa entrega anterior.

Revisión de código, datos y arte del 25 de noviembre de 2026. No certifica una auditoría exhaustiva de cada sistema ni el balance humano del juego.

## Estado real

Survivors 2D de recorrido por Chile, hecho con TypeScript, PixiJS 8, Tone.js, Vite y PWA. Guardado local y exportación por código; sin backend ni cuenta en la nube.

| Contenido contado en los datos | Cantidad |
| --- | ---: |
| Personajes | 26 |
| Armas con ranura / grito adicional | 15 / 1 |
| Rasgos | 20 |
| Evoluciones | 16 |
| Logros | 44 |
| Enemigos regulares / especiales | 14 / 2 |
| Jefes | 4 |
| Mejoras permanentes / vecinos | 12 / 4 |

Ya existen rarezas, pilares, relanzar/descartar cartas, animitas con bonos acumulables, cofres, feriante, élites/guardianes, tres pasajes, bestiario, estadísticas, ruta diaria y Antártica infinita. Los números antiguos de AUDITORIA.md no describen esta versión.

## Implementado en esta ronda

| Personaje | Cambio | Procedencia |
| --- | --- | --- |
| Zorro | Nuevo dibujo y ciclos de reposo/caminar; acciones adicionales adaptadas | ScratchIO, CC0 |
| Capibara | Sustitución por Charlie, reposo/caminar y acciones adicionales adaptadas | niffirgGames, permiso del autor |
| Puma | Cuerpo bajo, cola larga, orejas redondas y patas articuladas | Dibujo propio |
| Huemul | Pelaje gris/pardo, orejas anchas y astas cortas | Dibujo propio |
| Monito del monte | Hocico puntiagudo, anillo ocular y cola prensil | Dibujo propio |
| Chinchilla | Orejas redondas, cuerpo compacto y cola gruesa | Dibujo propio |
| Vizcacha | Orejas largas, cola hacia atrás y patas traseras grandes | Dibujo propio |

Se mantienen las diez acciones utilizadas por el juego. Los dibujos propios tienen seis cuadros de desplazamiento por especie; los externos conservan sus ocho cuadros de caminar. Las acciones externas adicionales son transformaciones sencillas de pose, no animaciones artesanales completas. El zorro es genérico, no una representación zoológica exacta del culpeo.

Los archivos originales y su procedencia están en `art-source/README.md`. `npm run sprites:importar-fauna` reproduce la conversión sin red. Los externos usan lienzos de 32×32 y sus colores originales; la selección adapta escala y anclaje. No se cambiaron estadísticas ni colisiones.

`docs/revision-fauna.html` compara las acciones antes/después con pausa y fondos distintos. `docs/revision-fauna.png` compara el reposo al mismo aumento de píxel.

**Guía de evoluciones en la pausa:** muestra las 16 recetas y el estado de la partida: falta reunirla, en curso, lista para una Caja del Almacén o evolucionada. Prioriza las combinaciones listas y en curso. Paginación y foco de teclado/mando; no altera el build ni consume números aleatorios.

## Referencias de diseño

Fuentes primarias: [Megabonk en Steam](https://store.steampowered.com/app/3405340/Megabonk/) y [Vampire Survivors en Steam](https://store.steampowered.com/app/1794680/Vampire_Survivors/).

Megabonk presenta rarezas aleatorias, personajes con habilidades y objetos con sinergias. Vampire Survivors destaca el crecimiento durante el viaje y recomienda enfocar armas y reembolsar mejoras para probar estrategias. Mi interpretación: QUILTRO necesita más decisiones y builds distintas; no necesita perseguir sus cantidades de contenido ni convertirse a 3D.

## Brechas y orden recomendado

| Prioridad | Evidencia en el proyecto | Mejora concreta | Criterio de éxito |
| --- | --- | --- | --- |
| 1 | Las recetas existían, faltaba consultarlas durante la partida | Guía implementada | Saber qué rasgo falta sin salir del juego |
| 1 | Recompensas centradas en armas, rasgos y bonos de estadísticas; no hay inventario separado de reliquias | 6 objetos que cambien comportamiento: críticos que rebotan, sobrecuración convertida en escudo, comida que activa ataques | Al menos tres combinaciones viables con decisiones distintas; comparar mismas semillas |
| 1 | `roadEvents.ts`: el cofre cobra y el feriante aplica su trato por proximidad | Interacción explícita con coste, riesgo y recompensa visibles | Pasar junto a un cofre sin gastar por accidente |
| 1 | Ruta lineal con hitos y eventos, sin decisiones de trayecto persistentes | Dos desvíos opcionales por zona: seguridad o desafío con botín | Cambiar de rumbo por un objetivo y decidir si vale el riesgo |
| 1 | Arte con siluetas parecidas; esta ronda también introduce mezcla de estilos | Probar estos siete animales en combate y seguir por lobo marino, guanaco, llama y pingüino | Reconocerlos a tamaño real con efectos encima |
| 2 | 44 logros, muchos acumulativos; sin selección de objetivos rastreables en el menú | Tres objetivos con progreso y desbloqueos concretos, sin otra moneda | Tener una razón clara para iniciar otro viaje |
| 2 | No encontré devolución de mejoras en `meta/progress.ts` ni su pantalla | Reembolsar y redistribuir mejoras, conservando vecinos y desbloqueos | Probar estrategias sin repetir horas de acumulación |
| 2 | `SaveData` almacena meta, no el estado del viaje en curso | Continuar viaje local, guardando RNG, build, enemigos, progreso y versión | Reabrir sin perder el viaje ni duplicar premios; requiere implementación dedicada |
| 2 | Hay daño por arma al terminar y estadísticas generales, sin historial de builds | Últimos 10 viajes con personaje, build, duración y causa de muerte | Entender y repetir una estrategia útil |
| 2 | `migrate()` confía en varios tipos; `save()` no captura errores de escritura | Validar importaciones y manejar almacenamiento lleno | Datos malformados o errores de escritura no bloquean el menú |
| 3 | `runScene.ts` concentra estados, orquestación y UI | Separar flujo, recompensas y presentación antes de sumar reliquias | Agregar un sistema sin modificar varias responsabilidades a la vez |
| 3 | Aviso de bloque JS mayor a 500 kB; calidad automática depende principalmente de si es móvil | Medir carga/rendimiento y separar módulos cuando ayude | Medición con un escenario de combate, no solo el menú |

Reliquias, desvíos, objetivos, reembolso, continuar viaje e historial **no están implementados** en esta entrega. Son el plan siguiente, no funciones terminadas.

## Verificación y límites

- Base previa: 171 pruebas pasaban.
- Primera verificación: 175 pruebas en 27 archivos, lint y tipos correctos, 59/59 contrastes de interfaz.
- Compilación de producción y PWA correctas, con aviso de tamaño de un bloque JS.
- Inspección de PNGs generados con los mismos cuadros usados por el juego.
- Falta probar visualmente la guía y las animaciones dentro de una partida real. No se afirma haber jugado, medido diversión ni certificado rendimiento móvil.
- El contraste de interfaz no certifica los animales sobre todos los escenarios. La mezcla de estilos necesita evaluación humana.

Recomendación: probar fauna y guía; después, reliquias y decisiones de exploración en tandas pequeñas con mediciones de balance. No sumar más personajes todavía.
