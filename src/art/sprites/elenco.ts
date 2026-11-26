import { anterior } from './elencoAnterior.ts';
import { recolor } from '../types.ts';

const colors: Record<string, Record<string, string>> = {
  monito: { m: 'O', M: 'd' },
  chinchilla: { g: 'I', G: 'i' },
  vizcacha: { m: 'C', M: 'd', g: 'O' },
};

export const elencoSprites = anterior.map(sprite => {
  const palette = colors[sprite.name];
  if (!palette) return sprite;
  return { ...sprite, animations: Object.fromEntries(Object.entries(sprite.animations).map(([name, anim]) =>
    [name, { ...anim, frames: anim.frames.map(frame => recolor(frame, palette)) }],
  )) };
});
