/**
 * @module ol/control/Control
 */
import BaseObject from '../Object.js';
import MapEventType from '../MapEventType.js';
import {VOID} from '../functions.js';
import {listen, unlistenByKey} from '../events.js';
import {removeNode} from '../dom.js';

/**
 * @typedef {Object} Options
 * @property {HTMLElement} [element] The element is the control's
 * container element. This only needs to be specified if you're developing
 * a custom control.
 * @property {function(import("../MapEvent.js").default):void} [render] Function called when
 * the control should be re-rendered. This is called in a `requestAnimationFrame`
 * callback.
 * @property {HTMLElement|string} [target] Specify a target if you want
 * the control to be rendered outside of the map's viewport.
 */

/**
 * @classdesc
 * A control is a visible widget with a DOM element in a fixed position on the
 * screen. They can involve user input (buttons), or be informational only;
 * the position is determined using CSS. By default these are placed in the
 * container with CSS class name `ol-overlaycontainer-stopevent`, but can use
 * any outside DOM element.
 *
 * This is the base class for controls. You can use it for simple custom
 * controls by creating the element with listeners, creating an instance:
 * ```js
 * const myControl = new Control({element: myElement});
 * ```
 * and then adding this to the map.
 *
 * The main advantage of having this as a control rather than a simple separate
 * DOM element is that preventing propagation is handled for you. Controls
 * will also be objects in a {@link module:ol/Collection~Collection}, so you can use their methods.
 *
 * You can also extend this base for your own control class. See
 * examples/custom-controls for an example of how to do this.
 *
 * @api
 */
class Control extends BaseObject {
  /**
   * @param {Options} options Control options.
   */
  constructor(options) {
    super();

    const element = options.element;
    if (element && !options.target && !element.style.pointerEvents) {
      element.style.pointerEvents = 'auto';
    }

    /**
     * @protected
     * @type {HTMLElement}
     */
    this.element = element ? element : null;

    /**
     * @private
     * @type {HTMLElement}
     */
    this.target_ = null;

    /**
     * @private
     * @type {import("../Map.js").default|null}
     */
    this.map_ = null;

    /**
     * @protected
     * @type {!Array<import("../events.js").EventsKey>}
     */
    this.listenerKeys = [];

    if (options.render) {
      this.render = options.render;
    }

    if (options.target) {
      this.setTarget(options.target);
    }
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    removeNode(this.element);
    super.disposeInternal();
  }

  /**
   * Get the map associated with this control.
   * @return {import("../Map.js").default|null} Map.
   * @api
   */
  getMap() {
    return this.map_;
  }

  /**
   * Remove the control from its current map and attach it to the new map.
   * Pass `null` to just remove the control from the current map.
   * Subclasses may set up event handlers to get notified about changes to
   * the map here.
   * @param {import("../Map.js").default|null} map Map.
   * @api
   */
  setMap(map) {
    if (this.map_) {
      removeNode(this.element);
    }
    for (let i = 0, ii = this.listenerKeys.length; i < ii; ++i) {
      unlistenByKey(this.listenerKeys[i]);
    }
    this.listenerKeys.length = 0;
    this.map_ = map;
    if (map) {
      const target = this.target_
        ? this.target_
        : map.getOverlayContainerStopEvent();
      target.appendChild(this.element);
      if (this.render !== VOID) {
        this.listenerKeys.push(
          listen(map, MapEventType.POSTRENDER, this.render, this)
        );
      }
      map.render();
    }
  }

  /**
   * Renders the control.
   * @param {import("../MapEvent.js").default} mapEvent Map event.
   * @api
   */
  render(mapEvent) {}

  /**
   * This function is used to set a target element for the control. It has no
   * effect if it is called after the control has been added to the map (i.e.
   * after `setMap` is called on the control). If no `target` is set in the
   * options passed to the control constructor and if `setTarget` is not called
   * then the control is added to the map's overlay container.
   * @param {HTMLElement|string} target Target.
   * @api
   */
  setTarget(target) {
    this.target_ =
      typeof target === 'string' ? document.getElementById(target) : target;
  }
}

export default Control;
