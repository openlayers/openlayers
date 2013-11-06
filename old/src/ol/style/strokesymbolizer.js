goog.provide('ol.style.Stroke');
goog.provide('ol.style.StrokeDefaults');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.LineLiteral');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.StrokeOptions=} opt_options Stroke options.
 * @todo stability experimental
 */
ol.style.Stroke = function(opt_options) {
  goog.base(this);
  var options = opt_options || {};

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.color_ = !goog.isDefAndNotNull(options.color) ?
      new ol.expr.Literal(ol.style.StrokeDefaults.color) :
      (options.color instanceof ol.expr.Expression) ?
          options.color : new ol.expr.Literal(options.color);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDefAndNotNull(options.opacity) ?
      new ol.expr.Literal(ol.style.StrokeDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.width_ = !goog.isDefAndNotNull(options.width) ?
      new ol.expr.Literal(ol.style.StrokeDefaults.width) :
      (options.width instanceof ol.expr.Expression) ?
          options.width : new ol.expr.Literal(options.width);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.zIndex_ = !goog.isDefAndNotNull(options.zIndex) ?
      new ol.expr.Literal(ol.style.StrokeDefaults.zIndex) :
      (options.zIndex instanceof ol.expr.Expression) ?
          options.zIndex : new ol.expr.Literal(options.zIndex);

};
goog.inherits(ol.style.Stroke, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.LineLiteral|ol.style.PolygonLiteral} Symbolizer literal.
 */
ol.style.Stroke.prototype.createLiteral = function(featureOrType) {
  var feature, type;
  if (featureOrType instanceof ol.Feature) {
    feature = featureOrType;
    var geometry = feature.getGeometry();
    type = geometry ? geometry.getType() : null;
  } else {
    type = featureOrType;
  }

  var color = ol.expr.evaluateFeature(
      this.color_, feature);
  goog.asserts.assertString(color, 'color must be a string');

  var opacity = Number(ol.expr.evaluateFeature(
      this.opacity_, feature));
  goog.asserts.assert(!isNaN(opacity), 'opacity must be a number');

  var width = Number(ol.expr.evaluateFeature(
      this.width_, feature));
  goog.asserts.assert(!isNaN(width), 'width must be a number');

  var zIndex = Number(ol.expr.evaluateFeature(this.zIndex_, feature));
  goog.asserts.assert(!isNaN(zIndex), 'zIndex must be a number');

  var literal = null;
  if (type === ol.geom.GeometryType.LINESTRING ||
      type === ol.geom.GeometryType.MULTILINESTRING) {
    literal = new ol.style.LineLiteral({
      color: color,
      opacity: opacity,
      width: width,
      zIndex: zIndex
    });
  } else if (type === ol.geom.GeometryType.POLYGON ||
      type === ol.geom.GeometryType.MULTIPOLYGON) {
    literal = new ol.style.PolygonLiteral({
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWidth: width,
      zIndex: zIndex
    });
  }

  return literal;
};


/**
 * Get the stroke color.
 * @return {ol.expr.Expression} Stroke color.
 */
ol.style.Stroke.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the stroke opacity.
 * @return {ol.expr.Expression} Stroke opacity.
 */
ol.style.Stroke.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Get the stroke width.
 * @return {ol.expr.Expression} Stroke width.
 */
ol.style.Stroke.prototype.getWidth = function() {
  return this.width_;
};


/**
 * Get the stroke zIndex.
 * @return {ol.expr.Expression} Stroke zIndex.
 */
ol.style.Stroke.prototype.getZIndex = function() {
  return this.zIndex_;
};


/**
 * Set the stroke color.
 * @param {ol.expr.Expression} color Stroke color.
 */
ol.style.Stroke.prototype.setColor = function(color) {
  goog.asserts.assertInstanceof(color, ol.expr.Expression);
  this.color_ = color;
};


/**
 * Set the stroke opacity.
 * @param {ol.expr.Expression} opacity Stroke opacity.
 */
ol.style.Stroke.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * Set the stroke width.
 * @param {ol.expr.Expression} width Stroke width.
 */
ol.style.Stroke.prototype.setWidth = function(width) {
  goog.asserts.assertInstanceof(width, ol.expr.Expression);
  this.width_ = width;
};


/**
 * Set the stroke zIndex.
 * @param {ol.expr.Expression} zIndex Stroke zIndex.
 */
ol.style.Stroke.prototype.setZIndex = function(zIndex) {
  goog.asserts.assertInstanceof(zIndex, ol.expr.Expression);
  this.zIndex_ = zIndex;
};


/**
 * @typedef {{strokeColor: string,
 *            strokeOpacity: number,
 *            strokeWidth: number,
 *            zIndex: number}}
 */
ol.style.StrokeDefaults = {
  color: '#696969',
  opacity: 0.75,
  width: 1.5,
  zIndex: 0
};
