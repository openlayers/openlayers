goog.provide('ol.renderer.canvas');
goog.provide('ol.renderer.canvas.CanvasRenderer');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Pixel');
goog.require('ol.canvas');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.Point');
goog.require('ol.renderer.Layer');
goog.require('ol.style.LiteralFill');
goog.require('ol.style.LiteralShape');
goog.require('ol.style.LiteralStroke');
goog.require('ol.style.LiteralSymbolizer');


/**
 * @return {boolean} Is supported.
 */
ol.renderer.canvas.isSupported = ol.canvas.isSupported;



/**
 * @constructor
 */
ol.renderer.canvas.CanvasRenderer = function() {

  /**
   * @type {CanvasRenderingContext2D}
   * @private
   */
  this.context_ = null;

  /**
   * @type {ol.Pixel}
   * @private
   */
  this.offset_ = null;

};


/**
 * Confirm that we're ready to render.
 * @private
 */
ol.renderer.canvas.CanvasRenderer.prototype.assertReady_ = function() {
  goog.asserts.assert(!goog.isNull(this.context_),
      'Call setTarget before rendering');
  goog.asserts.assert(!goog.isNull(this.offset_),
      'Call setOffset before rendering');
};


/**
 * @param {ol.Pixel} offset Pixel offset of top left corner of canvas.
 */
ol.renderer.canvas.CanvasRenderer.prototype.setOffset = function(offset) {
  this.offset_ = offset;
};


/**
 * @param {Element} canvas Target canvas element.
 */
ol.renderer.canvas.CanvasRenderer.prototype.setTarget = function(canvas) {
  this.context_ = canvas.getContext('2d');
};

