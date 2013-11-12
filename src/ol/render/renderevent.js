goog.provide('ol.render.Event');
goog.provide('ol.render.EventType');

goog.require('goog.events.Event');
goog.require('ol.render.IRender');


/**
 * @enum {string}
 */
ol.render.EventType = {
  POSTCOMPOSE: 'postcompose'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.render.EventType} type Type.
 * @param {Object=} opt_target Target.
 * @param {ol.render.IRender=} opt_render Render.
 * @param {ol.FrameState=} opt_frameState Frame state.
 * @param {?CanvasRenderingContext2D=} opt_context Context.
 * @param {?WebGLRenderingContext=} opt_gl GL.
 */
ol.render.Event = function(
    type, opt_target, opt_render, opt_frameState, opt_context, opt_gl) {

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
   * @type {WebGLRenderingContext|null|undefined}
   * @private
   */
  this.gl_ = opt_gl;

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
 * @return {WebGLRenderingContext|null|undefined} GL.
 */
ol.render.Event.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @return {ol.render.IRender|undefined} Render.
 */
ol.render.Event.prototype.getRender = function() {
  return this.render_;
};
