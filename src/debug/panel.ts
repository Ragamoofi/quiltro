/**
 * Debug panel (F1). A DOM overlay so it never touches the pixel-perfect canvas.
 * Systems register their own stats and controls; the panel just lays them out.
 * Also opens with `?debug` in the URL or three quick taps on the top-left corner
 * (for phones without F1).
 */
type Row =
  | { kind: 'stat'; label: string; read: () => string; el?: HTMLElement }
  | { kind: 'control'; el: HTMLElement };

export class DebugPanel {
  private readonly el: HTMLDivElement;
  private readonly sections = new Map<string, HTMLDivElement>();
  private readonly rows: Row[] = [];
  private visible = false;
  private refreshTimer = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'debug-panel';
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      zIndex: '1000',
      minWidth: '220px',
      maxHeight: 'calc(100vh - 16px)',
      overflowY: 'auto',
      padding: '8px 10px',
      background: 'rgba(42, 34, 51, 0.92)',
      color: '#FBF3E4',
      font: '12px/1.5 ui-monospace, Consolas, monospace',
      border: '1px solid #4A3F5C',
      borderRadius: '4px',
      display: 'none',
      touchAction: 'auto',
      userSelect: 'text',
    } satisfies Partial<CSSStyleDeclaration>);
    const title = document.createElement('div');
    title.textContent = 'QUILTRO · depuración (F1)';
    title.style.color = '#F4B942';
    title.style.marginBottom = '4px';
    this.el.append(title);
    document.body.append(this.el);

    if (new URLSearchParams(location.search).has('debug')) this.setVisible(true);
    this.listenCornerTaps();
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  get isVisible(): boolean {
    return this.visible;
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el.style.display = v ? 'block' : 'none';
    window.clearInterval(this.refreshTimer);
    if (v) {
      this.refresh();
      this.refreshTimer = window.setInterval(() => this.refresh(), 250);
    }
  }

  stat(section: string, label: string, read: () => string): void {
    const el = document.createElement('div');
    this.section(section).append(el);
    this.rows.push({ kind: 'stat', label, read, el });
  }

  toggleControl(section: string, label: string, get: () => boolean, set: (v: boolean) => void): void {
    const wrap = document.createElement('label');
    wrap.style.display = 'block';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = get();
    box.addEventListener('change', () => set(box.checked));
    wrap.append(box, ` ${label}`);
    this.section(section).append(wrap);
    this.rows.push({ kind: 'control', el: wrap });
  }

  slider(
    section: string,
    label: string,
    opts: { min: number; max: number; step: number },
    get: () => number,
    set: (v: number) => void,
  ): void {
    const wrap = document.createElement('label');
    wrap.style.display = 'block';
    const out = document.createElement('span');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(opts.min);
    input.max = String(opts.max);
    input.step = String(opts.step);
    input.value = String(get());
    input.style.width = '100%';
    const show = (): void => {
      out.textContent = `${label}: ${input.value}`;
    };
    input.addEventListener('input', () => {
      set(Number(input.value));
      show();
    });
    show();
    wrap.append(out, input);
    this.section(section).append(wrap);
  }

  button(section: string, label: string, fn: () => void, enabled = true): void {
    const b = document.createElement('button');
    b.textContent = label;
    b.disabled = !enabled;
    Object.assign(b.style, {
      margin: '2px 4px 2px 0',
      font: 'inherit',
      background: enabled ? '#2F7DE1' : '#4A3F5C',
      color: '#FBF3E4',
      border: 'none',
      borderRadius: '3px',
      padding: '2px 6px',
      cursor: enabled ? 'pointer' : 'not-allowed',
    } satisfies Partial<CSSStyleDeclaration>);
    b.addEventListener('click', fn);
    this.section(section).append(b);
  }

  select(section: string, label: string, options: readonly string[], onPick: (v: string) => void): void {
    const wrap = document.createElement('div');
    const sel = document.createElement('select');
    sel.style.font = 'inherit';
    for (const o of ['', ...options]) {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o || label;
      sel.append(opt);
    }
    sel.addEventListener('change', () => {
      if (sel.value) onPick(sel.value);
      sel.value = '';
    });
    wrap.append(sel);
    this.section(section).append(wrap);
  }

  note(section: string, text: string): void {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.color = '#7A6E8A';
    this.section(section).append(el);
  }

  private section(name: string): HTMLDivElement {
    let s = this.sections.get(name);
    if (!s) {
      s = document.createElement('div');
      s.style.marginTop = '6px';
      const h = document.createElement('div');
      h.textContent = name;
      h.style.color = '#7FB8F5';
      s.append(h);
      this.el.append(s);
      this.sections.set(name, s);
    }
    return s;
  }

  private refresh(): void {
    for (const r of this.rows) {
      if (r.kind === 'stat' && r.el) r.el.textContent = `${r.label}: ${r.read()}`;
    }
  }

  private listenCornerTaps(): void {
    let taps: number[] = [];
    window.addEventListener('pointerdown', (e) => {
      if (e.clientX > 48 || e.clientY > 48) return;
      const now = performance.now();
      taps = [...taps.filter((t) => now - t < 600), now];
      if (taps.length >= 3) {
        taps = [];
        this.toggle();
      }
    });
  }
}
