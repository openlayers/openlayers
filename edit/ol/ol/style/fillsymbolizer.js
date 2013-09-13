goog.provide('ol.style.Fill');

goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Expression');
goog.require('ol.expr.Literal');
goog.require('ol.geom.GeometryType');
goog.require('ol.style.PolygonLiteral');
goog.require('ol.style.Symbolizer');



/**
 * @constructor
 * @extends {ol.style.Symbolizer}
 * @param {ol.style.FillOptions=} opt_options Polygon options.
 */
ol.style.Fill = function(opt_options) {
  goog.base(this);
  var options = opt_options || {};

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.color_ = !goog.isDefAndNotNull(options.color) ?
      new ol.expr.Literal(ol.style.FillDefaults.color) :
      (options.color instanceof ol.expr.Expression) ?
          options.color : new ol.expr.Literal(options.color);

  /**
   * @type {ol.expr.Expression}
   * @private
   */
  this.opacity_ = !goog.isDefAndNotNull(options.opacity) ?
      new ol.expr.Literal(ol.style.FillDefaults.opacity) :
      (options.opacity instanceof ol.expr.Expression) ?
          options.opacity : new ol.expr.Literal(options.opacity);

};
goog.inherits(ol.style.Fill, ol.style.Symbolizer);


/**
 * @inheritDoc
 * @return {ol.style.PolygonLiteral} Literal shape symbolizer.
 */
ol.style.Fill.prototype.createLiteral = function(featureOrType) {
  var feature, type;
  if (featureOrType instanceof ol.Feature) {
    feature = featureOrType;
    var geometry = feature.getGeometry();
    type = geometry ? geometry.getType() : null;
  } else {
    type = featureOrType;
  }
  var literal = null;

  if (type === ol.geom.GeometryType.POLYGON ||
      type === ol.geom.GeometryType.MULTIPOLYGON) {

    var color = ol.expr.evaluateFeature(this.color_, feature);
    goog.asserts.assertString(
        color, 'color must be a string');

    var opacity = Number(ol.expr.evaluateFeature(this.opacity_, feature));
    goog.asserts.assert(!isNaN(opacity), 'opacity must be a number');

    literal = new ol.style.PolygonLiteral({
      fillColor: color,
      fillOpacity: opacity
    });
  }

  return literal;
};


/**
 * Get the fill color.
 * @return {ol.expr.Expression} Fill color.
 */
ol.style.Fill.prototype.getColor = function() {
  return this.color_;
};


/**
 * Get the fill opacity.
 * @return {ol.expr.Expression} Fill opacity.
 */
ol.style.Fill.prototype.getOpacity = function() {
  return this.opacity_;
};


/**
 * Set the fill color.
 * @param {ol.expr.Expression} color Fill color.
 */
ol.style.Fill.prototype.setColor = function(color) {
  goog.asserts.assertInstanceof(color, ol.expr.Expression);
  this.color_ = color;
};


/**
 * Set the fill opacity.
 * @param {ol.expr.Expression} opacity Fill opacity.
 */
ol.style.Fill.prototype.setOpacity = function(opacity) {
  goog.asserts.assertInstanceof(opacity, ol.expr.Expression);
  this.opacity_ = opacity;
};


/**
 * @typedef {{color: (string),
 *            opacity: (number)}}
 */
ol.style.FillDefaults = {
  color: '#ffffff',
  opacity: 0.4
};
