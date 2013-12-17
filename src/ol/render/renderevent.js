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
   * @private
   */
  this.render_ = opt_render;

  /**
   * @type {ol.FrameState|undefined}
   * @private
   */
  this.frameState_ = opt_frameState;

  /**
   * @type {CanvasRenderingContext2D|null|undefined}
   * @private
   */
  this.context_ = opt_context;

  /**
   * @type {ol.webgl.Context|null|undefined}
   * @private
   */
  this.glContext_ = opt_glContext;

};
goog.inherits(ol.render.Event, goog.events.Event);


/**
 * @return {CanvasRenderingContext2D|null|undefined} Context.
 */
ol.render.Event.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {ol.FrameState|undefined} Frame state.
 */
ol.render.Event.prototype.getFrameState = function() {
  return this.frameState_;
};


/**
 * @return {ol.webgl.Context|null|undefined} GL context.
 */
ol.render.Event.prototype.getGlContext = function() {
  return this.glContext_;
};


/**
 * @return {ol.render.IRender|undefined} Render.
 */
ol.render.Event.prototype.getRender = function() {
  return this.render_;
};
