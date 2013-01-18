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
   * @type {ol.renderer.Layer}
   * @private
   */
  this.layerRenderer_ = null;

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
  goog.asserts.assert(!goog.isNull(this.layerRenderer_),
      'Call setLayerRenderer before rendering');
  goog.asserts.assert(!goog.isNull(this.offset_),
      'Call setOffset before rendering');
};


/**
 * @param {ol.renderer.Layer} layerRenderer Layer renderer.
 */
ol.renderer.canvas.CanvasRenderer.prototype.setLayerRenderer =
    function(layerRenderer) {
  this.layerRenderer_ = layerRenderer;
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


/**
 * Render a geometry.
 * @param {ol.geom.Geometry} geometry The geometry to render.
 * @param {Array.<ol.style.LiteralSymbolizer>} symbolizers Symbolizers to render
 *    with.
 * @private
 */
ol.renderer.canvas.CanvasRenderer.prototype.renderGeometry_ =
    function(geometry, symbolizers) {
  this.assertReady_();
  if (geometry instanceof ol.geom.Point) {
    this.renderPoint_(geometry, symbolizers);
  } else {
    // TODO: render other geometry types
    goog.asserts.assert(false, 'Not yet implemented');
  }
};


/**
 * Render a point geometry.
 * @param {ol.geom.Point} point Point geometry.
 * @param {Array.<ol.style.LiteralSymbolizer>} symbolizers Symbolizers.
 * @private
 */
ol.renderer.canvas.CanvasRenderer.prototype.renderPoint_ =
    function(point, symbolizers) {
  for (var i = 0, ii = symbolizers.length; i < ii; ++i) {
    var symbolizer = symbolizers[i];
    if (symbolizer instanceof ol.style.LiteralShape) {
      if (symbolizer.type === ol.style.ShapeType.CIRCLE) {
        this.renderPointCircle_(point, symbolizer);
      } else {
        this.renderPointShape_(point, symbolizer);
      }
    }
  }
};


/**
 * Render a point as a circle.
 * @param {ol.geom.Point} point Point geometry.
 * @param {ol.style.LiteralShape} symbolizer Shape symbolizer.
 * @private
 */
ol.renderer.canvas.CanvasRenderer.prototype.renderPointCircle_ =
    function(point, symbolizer) {
  var coords = point.coordinates,
      coordinate = new ol.Coordinate(coords[0], coords[1]),
      mapRenderer = this.layerRenderer_.getMapRenderer(),
      pixel = mapRenderer.getPixelFromCoordinate(coordinate),
      px = pixel.x + this.offset_.x,
      py = pixel.y + this.offset_.y,
      twoPi = Math.PI * 2,
      radius = symbolizer.size / 2,
      /** @type {ol.style.LiteralFill} */
      fill = symbolizer.fill,
      /** @type {ol.style.LiteralStroke} */
      stroke = symbolizer.stroke,
      context = this.context_;

  if (!goog.isNull(fill)) {
    context.globalAlpha = fill.opacity;
    context.fillStyle = fill.color;
    context.beginPath();
    context.arc(px, py, radius, 0, twoPi, true);
    context.fill();
  }
  if (!goog.isNull(stroke)) {
    context.globalAlpha = stroke.opacity;
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.beginPath();
    context.arc(px, py, radius, 0, twoPi, true);
    context.stroke();
  }
};


/**
 * Render a point as a shape (other than circle).
 * @param {ol.geom.Point} point Point geometry.
 * @param {ol.style.LiteralShape} symbolizer Shape symbolizer.
 * @private
 */
ol.renderer.canvas.CanvasRenderer.prototype.renderPointShape_ =
    function(point, symbolizer) {
  // TODO: other shape types
  goog.asserts.assert(false, 'Not implemented');
};
