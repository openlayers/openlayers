/**
 * @module ol/render/Event
 */

import Event from '../events/Event.js';

class RenderEvent extends Event {

  /**
   * @param {import("./EventType.js").default} type Type.
   * @param {import("../transform.js").Transform=} opt_pixelTransform Transform.
   * @param {import("../PluggableMap.js").FrameState=} opt_frameState Frame state.
   * @param {?CanvasRenderingContext2D=} opt_context Context.
   * @param {?import("../webgl/Helper.js").default=} opt_glContext WebGL Context.
   */
  constructor(type, opt_pixelTransform, opt_frameState, opt_context, opt_glContext) {

    super(type);

    /**
     * Transform from css pixels (relative to the top-left corner of the map viewport)
     * to render pixel on this event's `context`.
     * @type {import("../transform.js").Transform|undefined}
     * @api
     */
    this.pixelTransform = opt_pixelTransform;

    /**
     * An object representing the current render frame state.
     * @type {import("../PluggableMap.js").FrameState|undefined}
     * @api
     */
    this.frameState = opt_frameState;

    /**
     * Canvas context. Only available when a Canvas renderer is used, null
     * otherwise.
     * @type {CanvasRenderingContext2D|null|undefined}
     * @api
     */
    this.context = opt_context;

    /**
     * WebGL context. Only available when a WebGL renderer is used, null
     * otherwise.
     * @type {import("../webgl/Helper.js").default|null|undefined}
     * @api
     */
    this.glContext = opt_glContext;

  }

}

export default RenderEvent;
