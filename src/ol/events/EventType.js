/**
 * @module ol/events/EventType
 */

/**
 * @enum {string}
 * @const
 */
export default {
  /**
   * Generic change event. Triggered when the revision counter is increased.
   * @event module:ol/events/Event~Event#change
   * @api
   */
  CHANGE: 'change',

  /**
   * Generic error event. Triggered when an error occurs.
   * @event module:ol/events/Event~Event#error
   * @api
   */
  ERROR: 'error',

  CLEAR: 'clear',
  CONTEXTMENU: 'contextmenu',
  CLICK: 'click',
  DBLCLICK: 'dblclick',
  DRAGENTER: 'dragenter',
  DRAGOVER: 'dragover',
  DROP: 'drop',
  KEYDOWN: 'keydown',
  KEYPRESS: 'keypress',
  LOAD: 'load',
  MOUSEDOWN: 'mousedown',
  MOUSEMOVE: 'mousemove',
  MOUSEOUT: 'mouseout',
  MOUSEUP: 'mouseup',
  MOUSEWHEEL: 'mousewheel',
  MSPOINTERDOWN: 'MSPointerDown',
  RESIZE: 'resize',
  TOUCHSTART: 'touchstart',
  TOUCHMOVE: 'touchmove',
  TOUCHEND: 'touchend',
  WHEEL: 'wheel'
};
