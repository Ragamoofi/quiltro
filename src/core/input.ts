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

  constructor(target: HTMLElement) {
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

  /** Recomputes `state` from raw devices. Call once per fixed update. */
  poll(): void {
    let x = 0;
    let y = 0;
    if (KEYS_LEFT.some((k) => this.down.has(k))) x -= 1;
    if (KEYS_RIGHT.some((k) => this.down.has(k))) x += 1;
    if (KEYS_UP.some((k) => this.down.has(k))) y -= 1;
    if (KEYS_DOWN.some((k) => this.down.has(k))) y += 1;

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
    this.state.hold =
      this.mouseHold || this.holdTouch !== null || KEYS_HOLD.some((k) => this.down.has(k));
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (GAME_KEYS.has(e.code) || e.code === 'F1') e.preventDefault();
    if (!e.repeat) this.pressedListeners.get(e.code)?.();
    this.down.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
  };

  private readonly reset = (): void => {
    this.down.clear();
    this.mouseHold = false;
    this.stick = null;
    this.holdTouch = null;
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') {
      if (e.button === 0) this.mouseHold = true;
      return;
    }
    e.preventDefault();
    const leftHalf = e.clientX < window.innerWidth / 2;
    if (leftHalf && !this.stick) {
      this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
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
