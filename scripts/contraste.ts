/**
 * Readability check: can you see every enemy, the dog and the food against each
 * zone's floor? Two measures per sprite (WCAG contrast ratio of luminances,
 * averaged over the floor's colours weighted by how often each shows up):
 *   - outline: the ink outline (#2A2233) against the floor. Below 3 the sprite loses its edge.
 *   - body: share of the sprite's own pixels (outline excluded) at least 1,35× apart from the floor.
 *     Below 45 % the sprite melts into the ground. (The outline is the main line of defence, so this one is looser.)
 * Usage: node scripts/contraste.ts [--quiet]   (exit code 1 if something fails)
 */
import { colorOf, hexToRgb } from '../src/art/palette.ts';
import { SUELO_PESOS } from '../src/art/sprites/suelos.ts';
import { SPRITES } from '../src/art/sprites/index.ts';
import { ENEMIGOS, ENEMIGOS_ESPECIALES } from '../src/data/enemigos.ts';
import { ZONAS } from '../src/data/zonas.ts';

const OUTLINE_MIN = 3;
const BODY_RATIO = 1.35;
const BODY_SHARE_MIN = 0.45;

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Only the outline is checked for these: the ice enemies are made of ice on purpose (their ink
 * outline carries them over the snow), and the food pickups glow and twinkle (animation 'brillo').
 */
const BODY_EXEMPT = new Set(['tempano', 'tempanito', 'sopaipilla', 'completo', 'chorrillana']);

const byName = new Map(SPRITES.map((s) => [s.name, s]));

/** Floor colours of a zone: luminance and share, weighting each variant by how often the world picks it. */
function floorColors(zone: string): { lum: number; share: number }[] {
  const def = byName.get(`suelo_${zone}`);
  const weights = SUELO_PESOS[zone] ?? [];
  const frames = def?.animations.variantes?.frames ?? [];
  const totalW = weights.reduce((a, b) => a + b, 0) || 1;
  const acc = new Map<string, number>();
  frames.forEach((f, i) => {
    const w = (weights[i] ?? 0) / totalW;
    for (const row of f) {
      for (const ch of row) acc.set(ch, (acc.get(ch) ?? 0) + w / (16 * 16));
    }
  });
  return [...acc.entries()].flatMap(([ch, share]) => {
    const c = colorOf(ch);
    return c ? [{ lum: luminance(c.hex), share }] : [];
  });
}

interface Row {
  zone: string;
  sprite: string;
  outline: number;
  body: number;
  ok: boolean;
}

/** Pixels of every frame of a sprite (not the white flash copies), as palette chars. */
function pixelsOf(name: string): string[] {
  const def = byName.get(name);
  if (!def) return [];
  return Object.entries(def.animations)
    .filter(([a]) => !a.endsWith('_blanco'))
    .flatMap(([, anim]) => anim.frames.flatMap((f) => f.flatMap((row) => [...row])))
    .filter((ch) => ch !== '.');
}

function measure(zone: string, sprite: string): Row | null {
  const floor = floorColors(zone);
  const px = pixelsOf(sprite);
  if (floor.length === 0 || px.length === 0) return null;
  const vs = (lum: number): number => floor.reduce((a, f) => a + ratio(lum, f.lum) * f.share, 0);
  const outline = vs(luminance('#2A2233'));
  const body = px.filter((ch) => ch !== 'k');
  const readable = body.filter((ch) => {
    const c = colorOf(ch);
    if (!c) return true;
    const l = luminance(c.hex);
    // A body pixel reads if it is clearly different from most of the floor.
    return floor.reduce((a, f) => a + (ratio(l, f.lum) >= BODY_RATIO ? f.share : 0), 0) >= 0.7;
  }).length;
  const share = body.length === 0 ? 1 : readable / body.length;
  const bodyMatters = !BODY_EXEMPT.has(sprite);
  return { zone, sprite, outline, body: share, ok: outline >= OUTLINE_MIN && (!bodyMatters || share >= BODY_SHARE_MIN) };
}

const ALWAYS = ['quiltro', 'sopaipilla', 'completo', 'chorrillana', 'proyectil'];
const rows: Row[] = [];
for (const z of ZONAS) {
  // La Antártica reuses Patagonia's enemies.
  const enemies = z.id === 'antartica' ? [...ENEMIGOS.filter((e) => e.zone === 'patagonia'), ...ENEMIGOS_ESPECIALES.filter((e) => e.zone === 'patagonia')].map((e) => e.id) : [...z.enemies, ...ENEMIGOS_ESPECIALES.filter((e) => e.zone === z.id).map((e) => e.id)];
  for (const s of [...ALWAYS, ...enemies]) {
    const r = measure(z.id, s);
    if (r) rows.push(r);
  }
}

const quiet = process.argv.includes('--quiet');
let bad = 0;
for (const r of rows) {
  if (!r.ok) bad++;
  if (!quiet || !r.ok) {
    console.warn(
      `${r.ok ? ' ok ' : 'FAIL'} ${r.zone.padEnd(10)} ${r.sprite.padEnd(12)} contorno ${r.outline.toFixed(1).padStart(4)}  cuerpo ${Math.round(r.body * 100)
        .toString()
        .padStart(3)} %`,
    );
  }
}
console.warn(`\n${rows.length - bad}/${rows.length} combinaciones se leen bien.`);
if (bad > 0) process.exit(1);
