/**
 * @module ol/render/Event
 */

import Event from '../events/Event.js';

class RenderEvent extends Event {

  /**
   * @param {import("./EventType.js").default} type Type.
   * @param {import("./VectorContext.js").default=} opt_vectorContext Vector context.
   * @param {import("../PluggableMap.js").FrameState=} opt_frameState Frame state.
   * @param {?CanvasRenderingContext2D=} opt_context Context.
   * @param {?import("../webgl/Context.js").default=} opt_glContext WebGL Context.
   */
  constructor(type, opt_vectorContext, opt_frameState, opt_context, opt_glContext) {

    super(type);

    /**
     * For canvas, this is an instance of {@link module:ol/render/canvas/Immediate}.
     * @type {import("./VectorContext.js").default|undefined}
     * @api
     */
    this.vectorContext = opt_vectorContext;

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
     * @type {import("../webgl/Context.js").default|null|undefined}
     * @api
     */
    this.glContext = opt_glContext;

  }

}

export default RenderEvent;
