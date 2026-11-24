import esCL from './es-CL.json';

/**
 * Text lookup. Every visible string lives in es-CL.json; code only uses keys.
 * `t('ui.sinLucas', { n: 40 })` → "Te faltan 40 lucas, compadre".
 */
type Dict = { [key: string]: string | string[] | Dict };

let dict: Dict = esCL as Dict;

export function setLanguage(next: Dict): void {
  dict = next;
}

function lookup(key: string): string | string[] | Dict | undefined {
  let node: string | string[] | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string' || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return node;
}

function fill(text: string, params?: Readonly<Record<string, string | number>>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

/** Translated string. Missing keys return the key itself so they are easy to spot. */
export function t(key: string, params?: Readonly<Record<string, string | number>>): string {
  const v = lookup(key);
  return typeof v === 'string' ? fill(v, params) : key;
}

/** Translated list (e.g. level-up shouts, loading facts). */
export function tList(key: string): readonly string[] {
  const v = lookup(key);
  return Array.isArray(v) ? v : [];
}

export function hasKey(key: string): boolean {
  return lookup(key) !== undefined;
}

/** Thousands with a dot, as in Chile: 4300 → "4.300". */
export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
