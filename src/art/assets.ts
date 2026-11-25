import { Assets, type Spritesheet, type Texture } from 'pixi.js';
import { animKey } from './types.ts';

/**
 * Runtime access to the sprite sheet built by scripts/build-sprites.ts.
 */
export interface Anim {
  readonly textures: readonly Texture[];
  readonly fps: number;
  readonly loop: boolean;
}

let sheet: Spritesheet | null = null;
let meta: Record<string, { fps: number; loop: boolean }> = {};

export async function loadSprites(): Promise<void> {
  sheet = await Assets.load<Spritesheet>('./assets/sprites.json');
  const data = sheet.data.meta as unknown as { animMeta?: typeof meta };
  meta = data.animMeta ?? {};
}

export function anim(sprite: string, name: string): Anim {
  if (!sheet) throw new Error('loadSprites() no se ha llamado');
  const key = animKey(sprite, name);
  const textures = sheet.animations[key];
  if (!textures) throw new Error(`Animación desconocida: ${key}`);
  const m = meta[key] ?? { fps: 8, loop: true };
  return { textures, fps: m.fps, loop: m.loop };
}

/** Frame index for an animation that has been playing `time` seconds. */
export function frameAt(a: Anim, time: number): number {
  const i = Math.floor(time * a.fps);
  return a.loop ? i % a.textures.length : Math.min(i, a.textures.length - 1);
}

/** The first frame of the first animation of a sprite (for lists that only need a picture). */
export function firstFrame(sprite: string): Texture | undefined {
  if (!sheet) return undefined;
  const prefix = `${sprite}/`;
  for (const [key, frames] of Object.entries(sheet.animations)) {
    if (key.startsWith(prefix) && !key.endsWith('_blanco')) return frames[0];
  }
  return undefined;
}

/** Does this sprite have this animation? */
export function hasAnim(sprite: string, name: string): boolean {
  return Boolean(sheet?.animations[animKey(sprite, name)]);
}