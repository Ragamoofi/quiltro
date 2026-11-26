/** Generates a self-contained animated comparison and a labelled PNG, without a browser. */
import { readFileSync, writeFileSync } from 'node:fs';
import { SPRITES } from '../src/art/sprites/index.ts';
import { PERSONAJES } from '../src/data/personajes.ts';
import { ART_PALETTE, colorOf, hexToRgb } from '../src/art/palette.ts';
import { textRows } from '../src/art/font.ts';
import type { Frame, SpriteDef } from '../src/art/types.ts';
import { encodePng } from './png.ts';

const first = ['capibara', 'zorro', 'puma', 'jaguar'];
const ordered = [...PERSONAJES].sort((a, b) => (first.includes(a.id) ? first.indexOf(a.id) : 99) - (first.includes(b.id) ? first.indexOf(b.id) : 99));
const ids = ordered.map(c => c.sprite);
const labels = JSON.parse(readFileSync('src/i18n/es-CL.json', 'utf8')) as { personajes: Record<string, string> };
const names = ordered.map(c => labels.personajes[c.id] ?? c.id);
const baseline = JSON.parse(readFileSync('art-source/elenco-anterior.json', 'utf8')) as SpriteDef[];
const pairs = ids.map((id, i) => ({ name: names[i], before: baseline.find(s => s.name === id), after: SPRITES.find(s => s.name === id) }));
const palette = Object.fromEntries(ART_PALETTE.map(c => [c.char, c.hex]));
const data = JSON.stringify({ pairs, palette }).replaceAll('<', '\\u003c');
const html = `<!doctype html><html lang="es-CL"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QUILTRO · revisión de fauna</title>
<style>body{margin:0;background:#171820;color:#fbf3e4;font:16px system-ui}main{max-width:1100px;margin:auto;padding:28px}h1{color:#ffd166;margin-bottom:8px}p{color:#b8aec4;line-height:1.6}.controls{position:sticky;top:0;background:#171820;padding:14px 0;display:flex;gap:14px;flex-wrap:wrap;z-index:1}select,button{background:#30303e;color:#fff;border:1px solid #777;border-radius:6px;padding:8px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px}article{background:#252632;border:1px solid #444654;border-radius:10px;padding:18px}h2{margin:0 0 12px;font-size:18px}.pair{display:flex;gap:10px}.stage{flex:1;text-align:center}.stage small{display:block;margin:6px}canvas{width:128px;height:128px;image-rendering:pixelated;background:#8c8579;border-radius:4px}.note{font-size:13px}</style>
<main><h1>QUILTRO · Fauna en movimiento</h1><p>Comparación al mismo aumento de píxel. Zorro y capibara: arte externo adaptado; el resto: nuevos dibujos propios. Los cuadros anteriores provienen de los dibujos originales del proyecto.</p>
<div class="controls"><label>Acción <select id="action"><option value="trotar">Movimiento</option><option value="quieto">Reposo</option><option value="parpadeo">Parpadeo</option><option value="cargar">Carga</option><option value="ladrar">Grito</option><option value="dano">Daño</option><option value="muerte">Caída</option><option value="dormir">Dormir</option><option value="estirar">Estirarse</option></select></label><button id="play">Pausar</button><label>Fondo <select id="bg"><option value="#8c8579">Neutro</option><option value="#d9cbb0">Norte</option><option value="#2d6a4f">Sur</option><option value="#a8e6f0">Hielo</option><option value="#2a2233">Oscuro</option></select></label></div><section id="grid"></section><p class="note">Las acciones sin bucle se repiten solo en esta lámina para poder revisarlas. En el juego respetan su duración.</p></main>
<script>const {pairs,palette}=${data};let time=0,last=0,playing=true;const nodes=[];for(const pair of pairs){const card=document.createElement('article');const title=document.createElement('h2');title.textContent=pair.name;card.append(title);const wrap=document.createElement('div');wrap.className='pair';for(const key of ['before','after']){const stage=document.createElement('div');stage.className='stage';const small=document.createElement('small');small.textContent=key==='before'?'Antes':'Ahora';const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;stage.append(small,canvas);wrap.append(stage);nodes.push({canvas,sprite:pair[key]});}card.append(wrap);document.getElementById('grid').append(card);}const action=document.getElementById('action');action.onchange=()=>time=0;document.getElementById('play').onclick=e=>{playing=!playing;e.target.textContent=playing?'Pausar':'Reanudar';};document.getElementById('bg').onchange=e=>document.querySelectorAll('canvas').forEach(c=>c.style.background=e.target.value);function tick(now){if(playing)time+=(now-last)/1000;last=now;for(const {canvas,sprite}of nodes){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,32,32);const a=sprite.animations[action.value];if(!a)continue;const f=a.frames[Math.floor(time*a.fps)%a.frames.length];const ox=Math.floor((32-sprite.width)/2),oy=32-sprite.height;f.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.'&&palette[c]){ctx.fillStyle=palette[c];ctx.fillRect(ox+x,oy+y,1,1);}}));}requestAnimationFrame(tick);}requestAnimationFrame(now=>{last=now;tick(now);});</script></html>`;
writeFileSync('docs/revision-fauna.html', html);

const W = 1200, H = 70 + Math.ceil(pairs.length / 4) * 170;
const rgba = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) rgba.set([39, 39, 50, 255], i * 4);
function draw(frame: Frame, x: number, y: number, zoom: number): void {
  frame.forEach((row, py) => [...row].forEach((c, px) => {
    const col = colorOf(c); if (!col) return;
    const rgb = hexToRgb(col.hex);
    for (let yy = 0; yy < zoom; yy++) for (let xx = 0; xx < zoom; xx++) {
      const dx = x + px * zoom + xx, dy = y + py * zoom + yy;
      if (dx >= 0 && dx < W && dy >= 0 && dy < H) rgba.set([...rgb, 255], (dy * W + dx) * 4);
    }
  }));
}
draw(textRows('QUILTRO - REVISION DE FAUNA', 'a', true), 24, 20, 2);
pairs.forEach((pair, i) => {
  const y = 70 + Math.floor(i / 4) * 170, cellX = (i % 4) * 300;
  draw(textRows(pair.name ?? '', 'w', true), cellX + 10, y, 1);
  draw(textRows('ANTES', 'G', true), cellX + 30, y + 18, 1);
  draw(textRows('AHORA', 'a', true), cellX + 165, y + 18, 1);
  for (const [sprite, x] of [[pair.before, cellX + 10], [pair.after, cellX + 150]] as const) {
    if (!sprite) continue;
    const frame = sprite.animations.quieto?.frames[0];
    if (frame) draw(frame, x + (32 - sprite.width) * 2, y + 32 + (32 - sprite.height) * 3, 3);
  }
});
writeFileSync('docs/revision-fauna.png', encodePng(W, H, rgba));
console.warn('Comparación animada y PNG: docs/revision-fauna.html y docs/revision-fauna.png');
