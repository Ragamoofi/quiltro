import { outlined, type Frame } from './types.ts';

/**
 * QUILTRO's own bitmap font (GDD "Tipografía": own 5×7 font when the web fonts
 * do not fit the pixel grid). Capitals are 5 px tall; every line is 7 px:
 * one row for accents, one gap row, then the letter. Lowercase input is shown
 * in capitals, so á/ñ/¿ all work. '#' = ink of the text colour.
 */
export const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '.##', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '..#', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  '!': ['#', '#', '#', '.', '#'],
  '¡': ['#', '.', '#', '#', '#'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
  '¿': ['.#.', '...', '.#.', '#..', '.##'],
  '.': ['.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '.#', '#.'],
  ':': ['.', '#', '.', '#', '.'],
  ';': ['..', '.#', '..', '.#', '#.'],
  "'": ['#', '#', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...'],
  '-': ['...', '...', '###', '...', '...'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  '(': ['.#', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '#.'],
  '×': ['...', '#.#', '.#.', '#.#', '...'],
  '·': ['.', '.', '#', '.', '.'],
  '→': ['....', '..#.', '####', '..#.', '....'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'],
  ' ': ['..', '..', '..', '..', '..'],
};

/** Accented capitals: base letter + mark drawn on the accent row. */
const ACCENTS: Readonly<Record<string, { base: string; mark: string }>> = {
  Á: { base: 'A', mark: '..#' },
  É: { base: 'E', mark: '..#' },
  Í: { base: 'I', mark: '..#' },
  Ó: { base: 'O', mark: '..#' },
  Ú: { base: 'U', mark: '..#' },
  Ü: { base: 'U', mark: '#.#' },
  Ñ: { base: 'N', mark: '.##.' },
};

export const GLYPH_HEIGHT = 5;
/** Accent row + gap + 5 px letter. */
export const LINE_HEIGHT = 7;

interface Glyph {
  rows: readonly string[];
  mark: string | null;
}

function glyph(ch: string): Glyph {
  const acc = ACCENTS[ch];
  if (acc) return { rows: GLYPHS[acc.base] ?? [], mark: acc.mark };
  return { rows: GLYPHS[ch] ?? GLYPHS['?'] ?? [], mark: null };
}

/** Width in px of a text (no outline). */
export function textWidth(text: string): number {
  const gs = [...text.toUpperCase()].map(glyph);
  return gs.reduce((w, g) => w + (g.rows[0]?.length ?? 0), 0) + Math.max(0, gs.length - 1);
}

/**
 * Text as rows of palette characters (7 rows: accents, gap, letters),
 * 1 px between glyphs. `compact` drops the accent rows when none are used.
 */
export function textRows(text: string, color: string, compact = false): Frame {
  const gs = [...text.toUpperCase()].map(glyph);
  const hasMarks = gs.some((g) => g.mark);
  const rows: string[] = [];
  if (!compact || hasMarks) {
    rows.push(
      gs.map((g) => {
        const w = g.rows[0]?.length ?? 0;
        return (g.mark ?? '').padEnd(w, '.').slice(0, w).replace(/#/g, color);
      }).join('.'),
    );
    rows.push('.'.repeat(rows[0]?.length ?? 0));
  }
  for (let y = 0; y < GLYPH_HEIGHT; y++) {
    rows.push(gs.map((g) => (g.rows[y] ?? '').replace(/#/g, color)).join('.'));
  }
  return rows;
}

/** Text with a 1 px ink outline. */
export function outlinedText(text: string, color: string, ink = 'k', compact = true): Frame {
  return outlined(textRows(text, color, compact), ink);
}

/** Splits text into lines no wider than `maxWidth` px. */
export function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (textWidth(next) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}
