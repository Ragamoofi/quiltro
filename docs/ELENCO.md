# Elenco de QUILTRO: segunda ronda visual

Se conserva el capibara y el zorro aprobado sin cambiar sus dibujos, sus colores ni sus animaciones. Los otros 24 personajes se redibujan en `src/art/sprites/elenco.ts`, en lienzos de 32×32. Las gamas de pelaje y plumaje viven en `src/art/castPalette.ts`; la interfaz conserva sus colores.

## Dirección de cada personaje

| Personaje | Identidad visual | Movimiento |
| --- | --- | --- |
| Capibara | Charlie, marrón con sombreado original, sin cambios | Ciclo externo conservado |
| Zorro | Perfil y pelaje rojizo de ScratchIO, sin cambios | Ciclo externo conservado |
| Puma | Arena, vientre crema, cuerpo bajo, hocico corto y cola larga sin manchas | Paso felino |
| Jaguar | Ocre dorado, cuerpo más robusto, rosetas oscuras y mandíbula clara | Paso pesado |
| Gato del Almacén | Atigrado naranja, patas claras, cola levantada y cascabel | Paso felino corto |
| Quiltro | Caramelo luminoso, orejas paradas, collar azul con placa | Trote |
| Ratonera | Pelaje blanco, silla negra, cara tricolor, orejas dobladas y collar rosa | Trote |
| Pudú | Castaño oscuro, cuerpo compacto y patas cortas | Saltitos |
| Huemul | Pardo, patas más largas, grupa clara, orejas laterales y astas cortas | Trote |
| Guanaco | Canela, pecho crema, cuello largo, cara oscura y orejas rectas | Trote |
| Llama | Lana marfil, textura de vellón, orejas largas con borlas y hocico claro | Trote |
| Monito del monte | Pardo oliva, máscara ocular, hocico fino y cola prensil enrollada | Corretear |
| Chinchilla | Gris frío, pecho claro, orejas redondas y cola tupida | Saltos |
| Vizcacha | Gris arena cálido, orejas largas, ojo entrecerrado y patas traseras grandes | Saltos |
| Chingue | Carbón verdoso, franja marfil, cuerpo bajo y cola arqueada grande | Trote bajo |
| Lobo marino | Café oscuro, melena, pecho canela y aletas anchas | Balanceo de cuerpo y aletas |
| Pingüino de Humboldt | Carbón azulado, pecho marfil, banda oscura y pies rosados | Balanceo lateral |
| Cóndor | Plumaje oscuro cálido, ala marfil, cuello claro y cabeza desnuda | Vuelo con cuerpo horizontal y aleteo amplio |
| Paloma rebelde | Azul grisáceo, cuello tornasol turquesa, pañuelo rojo y lentes | Vuelo horizontal |
| Flamenco | Rosa coral, cuello curvo al posarse, cuello estirado y patas hacia atrás al volar | Aleteo |
| Carpintero negro | Carbón, parche blanco, copete rojo y pico largo | Vuelo horizontal |
| Tucán | Plumaje oscuro, pecho amarillo, pico naranja grande con punta oscura | Vuelo horizontal |
| Caleuchito | Cian luminoso, patas sustituidas por hebras de niebla | Flotación |
| Pillán | Cobre volcánico, lomo y cola con llamas animadas | Trote con fuego |
| Perro del Dieciocho | Canela, manta roja/blanca/azul y chupalla | Trote |
| Trauquito | Verde musgo, poncho tejido, barba clara, sombrero y hacha | Paso corto |

La diferencia entre especies no se resuelve solo recoloreando: se comprueban 26 siluetas de reposo distintas. Algunos grises se mantienen por corresponder al animal, pero se separan en temperatura de color, proporciones, marcas y movimiento.

## Integración y revisión

- Reposo, parpadeo, desplazamiento, carga, grito, daño, caída, dormir, estiramiento y silueta para todo el elenco.
- Los 24 redibujos tienen ocho cuadros de desplazamiento. El collar del Quiltro conserva sus diez variantes desbloqueables.
- Menú, Cucha, mapa, carga, compañeros y tarjeta compartida usan el anclaje de la textura.
- El empaquetador aumenta el ancho de la hoja si su altura supera 4096px. Con este elenco se obtiene 1024×2927, en lugar de 512×6000.
- `node scripts/review-fauna.ts` regenera la comparación de los 26 personajes. Su línea de base está en `art-source/elenco-anterior.json`.
- `docs/revision-fauna.html`: comparación animada, selector de acción, pausa y fondos distintos; funciona sin red.
- `docs/revision-fauna.png`: lámina de antes/después, con capibara, zorro y puma al inicio.
- No se modifican estadísticas, desbloqueos ni colisiones.

La inspección se realizó sobre láminas de reposo y movimiento, junto con pruebas de integración. Falta evaluar visualmente el resultado dentro de una partida real, especialmente superposición con enemigos y efectos. Las poses de descanso/caída siguen siendo estilizadas.
