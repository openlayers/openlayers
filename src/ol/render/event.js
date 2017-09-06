import _ol_ from '../index';
import _ol_events_Event_ from '../events/event';

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
var _ol_render_Event_ = function(
    type, opt_vectorContext, opt_frameState, opt_context,
    opt_glContext) {

  _ol_events_Event_.call(this, type);

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

_ol_.inherits(_ol_render_Event_, _ol_events_Event_);
export default _ol_render_Event_;
