goog.provide('ol.layer.VectorEvent');
goog.provide('ol.layer.VectorEventType');

goog.require('goog.events.Event');
goog.require('ol.render.IRender');


/**
 * @enum {string}
 */
ol.layer.VectorEventType = {
  POSTRENDER: 'postrender'
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {ol.layer.VectorEventType} type Type.
 * @param {Object=} opt_target Target.
 * @param {ol.render.IRender=} opt_render Render.
 * @param {?CanvasRenderingContext2D=} opt_context Context.
 * @param {?WebGLRenderingContext=} opt_gl GL.
 */
ol.layer.VectorEvent =
    function(type, opt_target, opt_render, opt_context, opt_gl) {

  goog.base(this, type, opt_target);

  /**
   * @type {ol.render.IRender|undefined}
   * @private
   */
  this.render_ = opt_render;

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
goog.inherits(ol.layer.VectorEvent, goog.events.Event);


/**
 * @return {CanvasRenderingContext2D|null|undefined} Context.
 */
ol.layer.VectorEvent.prototype.getContext = function() {
  return this.context_;
};


/**
 * @return {WebGLRenderingContext|null|undefined} GL.
 */
ol.layer.VectorEvent.prototype.getGL = function() {
  return this.gl_;
};


/**
 * @return {ol.render.IRender|undefined} Render.
 */
ol.layer.VectorEvent.prototype.getRender = function() {
  return this.render_;
};
