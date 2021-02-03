/**
 * @module ol/render/Event
 */

import Event from '../events/Event.js';

class RenderEvent extends Event {
  /**
   * @param {import("./EventType.js").default} type Type.
   * @param {import("../transform.js").Transform} [opt_inversePixelTransform] Transform for
   *     CSS pixels to rendered pixels.
   * @param {import("../PluggableMap.js").FrameState} [opt_frameState] Frame state.
   * @param {?CanvasRenderingContext2D} [opt_context] Context.
   */
  constructor(type, opt_inversePixelTransform, opt_frameState, opt_context) {
    super(type);

    /**
     * Transform from CSS pixels (relative to the top-left corner of the map viewport)
     * to rendered pixels on this event's `context`. Only available when a Canvas renderer is used, null otherwise.
     * @type {import("../transform.js").Transform|undefined}
     * @api
     */
    this.inversePixelTransform = opt_inversePixelTransform;

    /**
     * An object representing the current render frame state.
     * @type {import("../PluggableMap.js").FrameState|undefined}
     * @api
     */
    this.frameState = opt_frameState;

    /**
     * Canvas context. Not available when the event is dispatched by the map. Only available
     * when a Canvas renderer is used, null otherwise.
     * @type {CanvasRenderingContext2D|null|undefined}
     * @api
     */
    this.context = opt_context;
  }
}

export default RenderEvent;
