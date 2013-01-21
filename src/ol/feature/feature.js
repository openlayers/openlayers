goog.provide('ol.feature.Feature');


goog.require('ol.Object');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.geom.Geometry=} opt_geometry Geometry.
 * @param {Object=} opt_values Attributes.
 * @param {ol.style.LiteralSymbolizer=} opt_symbolizer Symbolizer.
 */
ol.feature.Feature = function(opt_geometry, opt_values, opt_symbolizer) {

  goog.base(this, opt_values);

  /**
   * @private
   * @type {?ol.geom.Geometry}
   */
  this.geometry_ = goog.isDef(opt_geometry) ? opt_geometry : null;

  /**
   * @private
   * @type {?ol.style.LiteralSymbolizer}
   */
  this.symbolizer_ = goog.isDef(opt_symbolizer) ? opt_symbolizer : null;

};
goog.inherits(ol.feature.Feature, ol.Object);


/**
 * @return {?ol.geom.Geometry} The geometry.
 */
ol.feature.Feature.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * @param {?ol.geom.Geometry} geometry The geometry.
 */
ol.feature.Feature.prototype.setGeometry = function(geometry) {
  this.geometry_ = geometry;
};


/**
 * @return {?ol.style.LiteralSymbolizer} The symbolizer.
 */
ol.feature.Feature.prototype.getSymbolizer = function() {
  return this.symbolizer_;
};


/**
 * @param {?ol.style.LiteralSymbolizer} symbolizer The symbolizer.
 */
ol.feature.Feature.prototype.setGeometry = function(symbolizer) {
  this.symbolizer_ = symbolizer_;
};
