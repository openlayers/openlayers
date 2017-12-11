goog.provide('ol.render.Event');

goog.require('ol');
goog.require('ol.events.Event');


/**
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.render.Event}
 * @param {ol.render.EventType} type Type.
 * @param {ol.render.VectorContext=} opt_vectorContext Vector context.
 * @param {olx.FrameState=} opt_frameState Frame state.
 * @param {?CanvasRenderingContext2D=} opt_context Context.
 * @param {?ol.webgl.Context=} opt_glContext WebGL Context.
 */
ol.render.Event = function(
    type, opt_vectorContext, opt_frameState, opt_context,
    opt_glContext) {

  ol.events.Event.call(this, type);

  /**
   * For canvas, this is an instance of {@link ol.render.canvas.Immediate}.
   * @type {ol.render.VectorContext|undefined}
   * @api
   */
  this.vectorContext = opt_vectorContext;

  /**
   * An object representing the current render frame state.
   * @type {olx.FrameState|undefined}
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
   * @type {ol.webgl.Context|null|undefined}
   * @api
   */
  this.glContext = opt_glContext;

};
ol.inherits(ol.render.Event, ol.events.Event);
