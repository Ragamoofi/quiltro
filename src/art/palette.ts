/**
 * QUILTRO's 32-colour base palette, extended by licensed fauna colors below.
 *
 * Every sprite is a matrix of characters; each character maps to one entry here.
 * `.` (TRANSPARENT) is the only character that is not a colour.
 * The base colours come from the GDD ("Paleta"); the rest are the shadows and
 * lights derived from them so every zone has a muted floor and a bright cast.
 */
import { FAUNA_PALETTE } from './faunaPalette.ts';
import { CAST_PALETTE } from './castPalette.ts';

export interface PaletteColor {
  /** Single character used in sprite matrices. */
  readonly char: string;
  readonly hex: string;
  /** Spanish name shown in /sprites.html. */
  readonly name: string;
  /** What the colour is for. */
  readonly use: string;
}

export const TRANSPARENT = '.';

export const PALETTE: readonly PaletteColor[] = [
  // Neutrals
  { char: 'k', hex: '#2A2233', name: 'Tinta', use: 'Contorno de todo (base GDD)' },
  { char: 'K', hex: '#4A3F5C', name: 'Tinta clara', use: 'Sombras profundas, paneles' },
  { char: 'g', hex: '#7A6E8A', name: 'Lavanda gris', use: 'Sombras de objetos' },
  { char: 'G', hex: '#B8AEC4', name: 'Lavanda clara', use: 'Texto secundario, metal' },
  { char: 'w', hex: '#FBF3E4', name: 'Marraqueta', use: 'Paneles y texto claro (base GDD)' },
  { char: 'W', hex: '#FFFFFF', name: 'Blanco', use: 'Destello de golpe, brillos' },
  // Quiltro
  { char: 'c', hex: '#E8A15C', name: 'Caramelo', use: 'Pelaje del quiltro (base GDD)' },
  { char: 'C', hex: '#B86F3A', name: 'Caramelo tostado', use: 'Sombra del pelaje' },
  { char: 'l', hex: '#F6CB93', name: 'Caramelo crema', use: 'Luz del pelaje, hocico' },
  // Blues
  { char: 'b', hex: '#2F7DE1', name: 'Azul cielo', use: 'Pañoleta, UI principal (base GDD)' },
  { char: 'B', hex: '#1D4E9E', name: 'Azul profundo', use: 'Sombra de azul' },
  { char: 's', hex: '#7FB8F5', name: 'Celeste', use: 'Luz de azul, cielo' },
  // Danger
  { char: 'r', hex: '#E63946', name: 'Rojo copihue', use: 'Peligro, daño, enemigos (base GDD)' },
  { char: 'R', hex: '#9E1F35', name: 'Rojo vino', use: 'Sombra de rojo' },
  // Valparaíso facades
  { char: 'p', hex: '#FF8FAB', name: 'Rosa fachada', use: 'Centro / Valpo (base GDD)' },
  { char: 'y', hex: '#FFD166', name: 'Amarillo fachada', use: 'Centro / Valpo (base GDD)' },
  { char: 't', hex: '#6AD5C9', name: 'Turquesa fachada', use: 'Centro / Valpo (base GDD)' },
  { char: 'T', hex: '#2E9A93', name: 'Turquesa hondo', use: 'Sombra de turquesa' },
  // Norte
  { char: 'o', hex: '#E9A35B', name: 'Ocre desierto', use: 'Norte (base GDD)' },
  { char: 'O', hex: '#A8603A', name: 'Tierra roja', use: 'Cerros y tierra del norte' },
  { char: 'd', hex: '#6B3A2E', name: 'Café oscuro', use: 'Madera, tierra húmeda' },
  // Sur
  { char: 'f', hex: '#2D6A4F', name: 'Bosque valdiviano', use: 'Sur (base GDD)' },
  { char: 'F', hex: '#1B4235', name: 'Bosque profundo', use: 'Sombra del bosque' },
  { char: 'v', hex: '#5FA35A', name: 'Pasto', use: 'Pasto y hojas' },
  { char: 'V', hex: '#A3D16B', name: 'Brote', use: 'Luz de hojas' },
  // Patagonia
  { char: 'i', hex: '#A8E6F0', name: 'Glaciar', use: 'Patagonia (base GDD)' },
  { char: 'I', hex: '#5FA8C9', name: 'Hielo profundo', use: 'Sombra del hielo' },
  // Gold
  { char: 'a', hex: '#F4B942', name: 'Dorado sopaipilla', use: 'Experiencia y logros (base GDD)' },
  { char: 'A', hex: '#C9832A', name: 'Dorado tostado', use: 'Sombra del dorado' },
  // City
  { char: 'm', hex: '#8C8579', name: 'Pastelón', use: 'Suelo del centro' },
  { char: 'M', hex: '#5C574F', name: 'Asfalto', use: 'Juntas, sombras en el suelo' },
  { char: 'n', hex: '#D9CBB0', name: 'Arena clara', use: 'Arena, polvo, luz de piedra' },
];

/** Imported fauna retains its authored shading instead of collapsing into the UI's 32 colors. */
export const ART_PALETTE: readonly PaletteColor[] = [...PALETTE, ...FAUNA_PALETTE, ...CAST_PALETTE];
const BY_CHAR = new Map(ART_PALETTE.map((c) => [c.char, c]));

/** Returns the palette entry for a matrix character, or undefined for '.' / unknown. */
export function colorOf(char: string): PaletteColor | undefined {
  return BY_CHAR.get(char);
}

/** Parses '#RRGGBB' to [r, g, b]. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Hex string as a 0xRRGGBB number, for Pixi tints and clear colours. */
export function hexToNumber(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/** Frequently used colours by role, so code never hardcodes hex values. */
export const COLORS = {
  ink: '#2A2233',
  inkLight: '#4A3F5C',
  bread: '#FBF3E4',
  white: '#FFFFFF',
  caramel: '#E8A15C',
  sky: '#2F7DE1',
  danger: '#E63946',
  gold: '#F4B942',
} as const;
