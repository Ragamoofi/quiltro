/**
 * Keyboard + pointer input, read once per update.
 * Phase 0: movement axis and the "dar hilo" hold button. Touch: left half of the
 * screen is a floating joystick, right half is the hold button (GDD "Controles").
 */
export interface InputState {
  /** Movement direction, length ≤ 1. */
  moveX: number;
  moveY: number;
  /** "Dar hilo" is being held (mouse, Space, or right half touch). */
  hold: boolean;
}

const KEYS_LEFT = ['KeyA', 'ArrowLeft'];
const KEYS_RIGHT = ['KeyD', 'ArrowRight'];
const KEYS_UP = ['KeyW', 'ArrowUp'];
const KEYS_DOWN = ['KeyS', 'ArrowDown'];
const KEYS_HOLD = ['Space'];
const GAME_KEYS = new Set([...KEYS_LEFT, ...KEYS_RIGHT, ...KEYS_UP, ...KEYS_DOWN, ...KEYS_HOLD]);

/** Joystick radius in CSS pixels before the stick saturates. */
const STICK_RADIUS = 40;
const STICK_DEADZONE = 6;

export class Input {
  readonly state: InputState = { moveX: 0, moveY: 0, hold: false };

  private readonly down = new Set<string>();
  private mouseHold = false;
  private stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
  private holdTouch: number | null = null;
  private readonly pressedListeners = new Map<string, () => void>();

  private readonly target: HTMLElement;

  /**
   * Virtual joystick in native pixels for drawing it (null when not touching).
   * `nativeW/H` is the current game resolution.
   */
  stickNative(nativeW: number, nativeH: number): { ox: number; oy: number; x: number; y: number } | null {
    if (!this.stick) return null;
    const r = this.target.getBoundingClientRect();
    const sx = nativeW / r.width;
    const sy = nativeH / r.height;
    const dx = this.stick.x - this.stick.ox;
    const dy = this.stick.y - this.stick.oy;
    const len = Math.hypot(dx, dy);
    const k = len > STICK_RADIUS ? STICK_RADIUS / len : 1;
    return {
      ox: (this.stick.ox - r.left) * sx,
      oy: (this.stick.oy - r.top) * sy,
      x: (this.stick.ox + dx * k - r.left) * sx,
      y: (this.stick.oy + dy * k - r.top) * sy,
    };
  }

  /** True while a touch is holding the right half (to draw the button pressed). */
  get touchHolding(): boolean {
    return this.holdTouch !== null;
  }

  constructor(target: HTMLElement) {
    this.target = target;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.reset);
    target.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    target.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Calls `fn` on the key-down edge of `code` (e.g. 'F1', 'Escape'). */
  onPress(code: string, fn: () => void): void {
    this.pressedListeners.set(code, fn);
  }

  /** 'alternar': a tap starts giving line, the next tap releases (Opciones). */
  holdMode: 'mantener' | 'alternar' = 'mantener';
  /** 'fijo': the touch joystick is anchored bottom-left instead of where you touch. */
  joystickMode: 'flotante' | 'fijo' = 'flotante';
  private latched = false;
  private rawHoldBefore = false;
  private padButtons: boolean[] = [];
  /** True once any gamepad has been used (to show pad hints). */
  usedPad = false;

  /** Gamepad buttons → the same codes the keyboard uses, so scenes need no extra code. */
  private static readonly PAD_CODES: Readonly<Record<number, string>> = {
    0: 'GamepadA',
    1: 'Escape',
    3: 'KeyR',
    9: 'Escape',
    12: 'ArrowUp',
    13: 'ArrowDown',
    14: 'ArrowLeft',
    15: 'ArrowRight',
  };

  private pollPad(): { x: number; y: number; hold: boolean } | null {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const pad = [...pads].find((p) => p?.connected);
    if (!pad) return null;
    pad.buttons.forEach((b, i) => {
      const pressed = b.pressed;
      if (pressed && !this.padButtons[i]) {
        this.usedPad = true;
        const code = Input.PAD_CODES[i];
        if (code) this.pressedListeners.get(code)?.();
      }
      this.padButtons[i] = pressed;
    });
    const ax = pad.axes[0] ?? 0;
    const ay = pad.axes[1] ?? 0;
    const mag = Math.hypot(ax, ay);
    const hold = !!pad.buttons[0]?.pressed || (pad.buttons[7]?.value ?? 0) > 0.3;
    if (mag > 0.2 || hold) this.usedPad = true;
    return mag > 0.2 ? { x: ax, y: ay, hold } : { x: 0, y: 0, hold };
  }

  /** Balance bot: when set, replaces what the devices say (never set in normal play). */
  override: InputState | null = null;

  /** Recomputes `state` from raw devices. Call once per fixed update. */
  poll(): void {
    if (this.override) {
      Object.assign(this.state, this.override);
      return;
    }
    let x = 0;
    let y = 0;
    if (KEYS_LEFT.some((k) => this.down.has(k))) x -= 1;
    if (KEYS_RIGHT.some((k) => this.down.has(k))) x += 1;
    if (KEYS_UP.some((k) => this.down.has(k))) y -= 1;
    if (KEYS_DOWN.some((k) => this.down.has(k))) y += 1;
    const pad = this.pollPad();
    if (pad && (pad.x !== 0 || pad.y !== 0)) {
      x = pad.x;
      y = pad.y;
    }

    if (this.stick) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const len = Math.hypot(dx, dy);
      if (len > STICK_DEADZONE) {
        const k = Math.min(1, len / STICK_RADIUS) / len;
        x = dx * k;
        y = dy * k;
      }
    }

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    this.state.moveX = x;
    this.state.moveY = y;
    const raw = this.mouseHold || this.holdTouch !== null || KEYS_HOLD.some((k) => this.down.has(k)) || !!pad?.hold;
    if (this.holdMode === 'alternar') {
      if (raw && !this.rawHoldBefore) this.latched = !this.latched;
      this.state.hold = this.latched;
    } else {
      this.state.hold = raw;
    }
    this.rawHoldBefore = raw;
  }

  /** Where the fixed joystick sits (client px). */
  private fixedOrigin(): { x: number; y: number } {
    return { x: window.innerWidth * 0.16, y: window.innerHeight * 0.78 };
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (GAME_KEYS.has(e.code) || e.code === 'F1' || e.code === 'Escape') e.preventDefault();
    if (!e.repeat) this.pressedListeners.get(e.code)?.();
    this.down.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  /** Drops every key-press handler (scene change). */
  clearPresses(): void {
    this.pressedListeners.clear();
  }

  /** Forgets held buttons (call when a menu opens or closes). */
  clear(): void {
    this.reset();
  }

  private readonly reset = (): void => {
    this.down.clear();
    this.mouseHold = false;
    this.stick = null;
    this.holdTouch = null;
    this.latched = false;
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') {
      if (e.button === 0) this.mouseHold = true;
      return;
    }
    e.preventDefault();
    const leftHalf = e.clientX < window.innerWidth / 2;
    if (leftHalf && !this.stick) {
      const o = this.joystickMode === 'fijo' ? this.fixedOrigin() : { x: e.clientX, y: e.clientY };
      this.stick = { id: e.pointerId, ox: o.x, oy: o.y, x: e.clientX, y: e.clientY };
    } else if (!leftHalf && this.holdTouch === null) {
      this.holdTouch = e.pointerId;
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (this.stick && e.pointerId === this.stick.id) {
      this.stick.x = e.clientX;
      this.stick.y = e.clientY;
    }
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button === 0) this.mouseHold = false;
    if (this.stick?.id === e.pointerId) this.stick = null;
    if (this.holdTouch === e.pointerId) this.holdTouch = null;
  };
}
