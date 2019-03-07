/**
 * Type declarations extending TypeScript's lib/lib.dom.d.ts.
 * https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts
 */

interface Document {
  readonly webkitIsFullScreen: boolean;

  readonly fullscreenElement: Element;
  readonly msFullscreenElement: Element;
  readonly webkitFullscreenElement: Element;

  readonly msFullscreenEnabled: boolean;
  readonly webkitFullscreenEnabled: boolean;

  msExitFullscreen(): void;
  webkitExitFullscreen(): void;
}

interface Element {
  msRequestFullscreen(): Promise<void>;
  webkitRequestFullscreen(allowKeyboardInput?: number): Promise<void>;
}
