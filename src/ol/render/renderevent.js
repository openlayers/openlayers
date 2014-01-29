goog.provide('ol.render.Event');
goog.provide('ol.render.EventType');

goog.require('goog.events.Event');
goog.require('ol.render.IRender');


/**
 * @enum {string}
 */
ol.render.EventType = {
  POSTCOMPOSE: 'postcompose',
  PRECOMPOSE: 'precompose'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.render.Event}
 * @param {ol.render.EventType} type Type.
 * @param {Object=} opt_target Target.
 * @param {ol.render.IRender=} opt_render Render.
 * @param {ol.FrameState=} opt_frameState Frame state.
 * @param {?CanvasRenderingContext2D=} opt_context Context.
 * @param {?ol.webgl.Context=} opt_glContext WebGL Context.
 */
ol.render.Event = function(
    type, opt_target, opt_render, opt_frameState, opt_context,
    opt_glContext) {

  goog.base(this, type, opt_target);

  /**
   * @type {ol.render.IRender|undefined}
   */
  this.render = opt_render;

  /**
   * @type {ol.FrameState|undefined}
   */
  this.frameState = opt_frameState;

  /**
   * @type {CanvasRenderingContext2D|null|undefined}
   */
  this.context = opt_context;

  /**
   * @type {ol.webgl.Context|null|undefined}
   */
  this.glContext = opt_glContext;

};
goog.inherits(ol.render.Event, goog.events.Event);
