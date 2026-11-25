import { Container, Sprite, Texture } from 'pixi.js';
import { anim, frameAt, type Anim } from '../../art/assets.ts';
import { colorOf } from '../../art/palette.ts';
import { deriveSeed, Rng } from '../../core/rng.ts';

type Kind = 'moto' | 'auto' | 'peaton' | 'gaviota' | 'condor' | 'mariposa';

interface Rule {
  kind: Kind;
  /** Spawns per second, and how many may exist at once. */
  rate: number;
  max: number;
}

/**
 * What lives in each place. Nothing here hurts or blocks the dog: it is the street going on
 * around you (Santiago, the Estación Central barrio: delivery bikes, cars and people in a hurry),
 * gulls over the coast, a condor's shadow over the desert, butterflies in the south.
 */
const RULES: Readonly<Record<string, readonly Rule[]>> = {
  desierto: [{ kind: 'condor', rate: 0.04, max: 1 }],
  santiago: [
    { kind: 'moto', rate: 0.22, max: 2 },
    { kind: 'auto', rate: 0.16, max: 2 },
    { kind: 'peaton', rate: 0.45, max: 5 },
  ],
  costa: [{ kind: 'gaviota', rate: 0.15, max: 2 }],
  araucania: [{ kind: 'mariposa', rate: 0.4, max: 4 }],
  lagos: [{ kind: 'mariposa', rate: 0.3, max: 3 }],
};

const AUTOS = ['rojo', 'azul', 'turquesa', 'rosado'] as const;
const PEATONES = ['peaton1', 'peaton2', 'peaton3', 'peaton4'] as const;
const POOL = 14;

interface Mover {
  active: boolean;
  kind: Kind;
  sprite: Sprite;
  shadow: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: number;
  age: number;
  life: number;
  phase: number;
  anim: Anim | null;
}

export class AmbientLife {
  /** Goes with the y-sorted world. */
  readonly root = new Container();
  /** Goes under the shadows layer. */
  readonly shadows = new Container();
  private readonly pool: Mover[] = [];
  private readonly rng: Rng;
  private readonly acc = new Map<Kind, number>();
  private readonly smallShadow: Texture | undefined;
  private readonly condorShadow: Texture;
  private time = 0;

  constructor(seed: number) {
    // Its own random stream: the scenery never touches the run's dice.
    this.rng = new Rng(deriveSeed(seed, 3));
    this.smallShadow = anim('sombra', 'chica').textures[0];
    this.condorShadow = makeCondorShadow();
    for (let i = 0; i < POOL; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5, 1);
      sprite.visible = false;
      const shadow = new Sprite();
      shadow.anchor.set(0.5);
      shadow.visible = false;
      this.root.addChild(sprite);
      this.shadows.addChild(shadow);
      this.pool.push({ active: false, kind: 'peaton', sprite, shadow, x: 0, y: 0, vx: 0, vy: 0, dir: 1, age: 0, life: 0, phase: 0, anim: null });
    }
  }

  private count(kind: Kind): number {
    return this.pool.filter((m) => m.active && m.kind === kind).length;
  }

  /** originX/Y: world coordinates of the screen's top-left corner. */
  update(dt: number, env: string, originX: number, originY: number, viewW: number, viewH: number): void {
    this.time += dt;
    for (const rule of RULES[env] ?? []) {
      const acc = (this.acc.get(rule.kind) ?? 0) + rule.rate * dt;
      if (acc >= 1 && this.count(rule.kind) < rule.max) {
        this.acc.set(rule.kind, 0);
        this.spawn(rule.kind, originX, originY, viewW, viewH);
      } else this.acc.set(rule.kind, Math.min(acc, 1));
    }
    for (const m of this.pool) {
      if (!m.active) continue;
      m.age += dt;
      if (m.kind === 'mariposa') {
        // A wobbling flutter: the direction drifts all the time.
        const a = Math.sin(m.age * 1.7 + m.phase) * 2.2 + m.phase;
        m.vx = Math.cos(a) * 16;
        m.vy = Math.sin(a * 0.8) * 11;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const gone =
        m.age > m.life ||
        m.x < originX - 90 ||
        m.x > originX + viewW + 90 ||
        m.y < originY - 70 ||
        m.y > originY + viewH + 70;
      if (gone) {
        m.active = false;
        m.sprite.visible = false;
        m.shadow.visible = false;
      }
    }
  }

  private spawn(kind: Kind, ox: number, oy: number, vw: number, vh: number): void {
    const m = this.pool.find((it) => !it.active);
    if (!m) return;
    const r = this.rng;
    const dir = r.chance(0.5) ? 1 : -1;
    m.active = true;
    m.kind = kind;
    m.dir = dir;
    m.age = 0;
    m.phase = r.range(0, 6);
    m.vy = 0;
    m.x = dir > 0 ? ox - 40 : ox + vw + 40;
    m.y = oy + r.range(40, vh - 12);
    m.life = 40;
    m.anim = null;
    let tex: Texture | undefined;
    switch (kind) {
      case 'moto':
        m.vx = dir * r.range(105, 140);
        m.anim = anim('moto', 'correr');
        break;
      case 'auto': {
        m.vx = dir * r.range(62, 85);
        tex = anim('auto', r.pick(AUTOS)).textures[0];
        break;
      }
      case 'peaton':
        m.vx = dir * r.range(11, 18);
        m.anim = anim(r.pick(PEATONES), 'caminar');
        break;
      case 'gaviota':
        m.vx = dir * r.range(40, 55);
        m.vy = r.range(-4, 4);
        m.anim = anim('gaviota', 'volar');
        m.y = oy + r.range(50, vh * 0.7);
        break;
      case 'condor':
        m.vx = dir * 34;
        m.y = oy + r.range(40, vh - 40);
        m.life = 60;
        break;
      case 'mariposa':
        m.x = ox + r.range(20, vw - 20);
        m.y = oy + r.range(50, vh - 20);
        m.vx = 0;
        m.life = r.range(8, 14);
        m.anim = anim('mariposa', 'aletear');
        break;
    }
    if (tex) m.sprite.texture = tex;
    m.sprite.visible = kind !== 'condor';
    // Shadows: small ones under the ground things, a big dithered one for the condor.
    if (kind === 'condor') {
      m.shadow.texture = this.condorShadow;
      m.shadow.visible = true;
    } else if (kind === 'gaviota' || kind === 'mariposa') {
      if (this.smallShadow) m.shadow.texture = this.smallShadow;
      m.shadow.visible = true;
    } else {
      if (this.smallShadow) m.shadow.texture = this.smallShadow;
      m.shadow.visible = kind !== 'auto';
    }
  }

  render(): void {
    for (const m of this.pool) {
      if (!m.active) continue;
      if (m.anim) {
        const tex = m.anim.textures[frameAt(m.anim, this.time + m.phase)];
        if (tex) m.sprite.texture = tex;
      }
      const x = Math.round(m.x);
      const y = Math.round(m.y);
      m.sprite.scale.x = m.dir;
      const flying = m.kind === 'gaviota' || m.kind === 'mariposa';
      const lift = m.kind === 'gaviota' ? 26 : m.kind === 'mariposa' ? 10 : 0;
      m.sprite.position.set(x, y - lift);
      // Flyers draw above everything on the ground.
      m.sprite.zIndex = flying ? y + 400 : y;
      m.shadow.position.set(x, y + (m.kind === 'condor' ? 0 : 1));
    }
  }
}

/** A big, soft, dithered oval: the shadow of a condor gliding far above. */
function makeCondorShadow(): Texture {
  const w = 56;
  const h = 22;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Texture.EMPTY;
  ctx.fillStyle = colorOf('k')?.hex ?? '#2A2233';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = ((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2;
      // Wings: a body in the middle and two swept tips, checkerboard-dithered.
      const wing = Math.abs(x - w / 2) > 8 ? ((y - h / 2) / (h / 2) + (Math.abs(x - w / 2) / (w / 2)) * 0.9) ** 2 < 0.35 : d < 0.25;
      if (wing && (x + y) % 2 === 0) ctx.fillRect(x, y, 1, 1);
    }
  }
  const t = Texture.from(canvas);
  t.source.scaleMode = 'nearest';
  return t;
}
