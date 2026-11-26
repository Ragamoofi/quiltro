import { Container } from 'pixi.js';
import { RELICS, type FairChallenge } from '../game/systems/fairChallenge.ts';
import type { RunContext } from '../game/context.ts';
import { PixelText } from './text.ts';
import { Button, FocusList } from './widgets.ts';

export class FairView {
  readonly root = new Container();
  readonly focus = new FocusList();
  private readonly progress = new PixelText('', { color: 'a', outline: 'k' });
  private readonly cards = new Container();
  private key = '';

  constructor() {
    this.root.addChild(this.progress, this.cards);
  }

  show(fair: FairChallenge, ctx: RunContext, width: number, height: number, choose: (id: number) => void): void {
    this.progress.text = fair.progress(ctx.stats.kills, ctx.player.x, ctx.player.y, ctx.time);
    this.progress.position.set(Math.round((width - this.progress.width) / 2), 42);
    const offers = fair.choices;
    const key = offers.length ? width + ':' + height + ':' + offers.join(',') : '';
    if (key === this.key) return;
    this.key = key;
    this.cards.removeChildren().forEach(child => child.destroy({ children: true }));
    const w = Math.min(280, width - 20);
    const buttons = offers.flatMap((id, index) => {
      const relic = RELICS[id];
      if (!relic) return [];
      const x = Math.round((width - w) / 2);
      const y = height - 38 - (offers.length - index) * 40;
      const button = new Button((index + 1) + '. ' + relic.name, w, 20, () => choose(id), 'b', 'w');
      button.position.set(x, y);
      const detail = new PixelText(relic.description, { maxWidth: w, color: 'w', outline: 'k' });
      detail.position.set(x, y + 21);
      this.cards.addChild(button, detail);
      return [button];
    });
    this.focus.set(buttons);
  }
}
