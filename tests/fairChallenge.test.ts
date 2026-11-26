import { expect, it, vi } from 'vitest';
import { FairChallenge } from '../src/game/systems/fairChallenge.ts';
import type { RunContext } from '../src/game/context.ts';

it('offers a choice after twelve kills and only grants one reward', () => {
  const fair = new FairChallenge();
  const ctx = {
    player: { x: 0, y: 0, dead: false },
    stats: { kills: 0, food: 25 },
    banner: vi.fn(),
    sfx: { play: vi.fn() },
  } as unknown as RunContext;
  fair.start(ctx);
  ctx.stats.kills = 12;
  fair.update(1, ctx, false);
  expect(fair.choices).toEqual([0, 1, 2]);
  fair.choose(2, ctx);
  fair.choose(0, ctx);
  expect([...fair.owned]).toEqual([2]);
  expect(fair.choices).toEqual([]);
});

it('uses the regional target and measures the boundary from the stand', () => {
  const fair = new FairChallenge();
  const ctx = {
    player: { x: 18, y: 0, dead: false },
    stats: { kills: 0, food: 0 },
    banner: vi.fn(),
  } as unknown as RunContext;
  fair.start(ctx, 'sur', 0, 0);
  expect(fair.boundary).toMatchObject({ x: 0, y: 0, radius: 105 });
  ctx.stats.kills = 12;
  fair.update(1, ctx, false);
  expect(fair.choices).toEqual([]);
  ctx.player.x = 106;
  ctx.stats.kills = 14;
  fair.update(1, ctx, false);
  expect(fair.boundary).toBeUndefined();
  expect(fair.choices).toEqual([]);
});
