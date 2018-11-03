/**
 * Type declarations extending TypeScript's lib/lib.dom.d.ts.
 * https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts
 */

interface Document {
  readonly mozFullScreen: boolean;
  readonly webkitIsFullScreen: boolean;

  readonly fullscreenElement: Element;
  readonly mozFullScreenElement: Element;
  readonly msFullscreenElement: Element;
  readonly webkitFullscreenElement: Element;

  readonly mozFullScreenEnabled: boolean;
  readonly msFullscreenEnabled: boolean;
  readonly webkitFullscreenEnabled: boolean;

  mozCancelFullScreen(): void;
  msExitFullscreen(): void;
  webkitExitFullscreen(): void;
}

interface Element {
  mozRequestFullScreen(): Promise<void>;
  mozRequestFullScreenWithKeys(): Promise<void>;
  msRequestFullscreen(): Promise<void>;
  webkitRequestFullscreen(allowKeyboardInput?: number): Promise<void>;
}

interface CSSStyleDeclaration {
  msTransform: string | null;
}
