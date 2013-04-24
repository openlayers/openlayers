goog.provide('ol.Feature');

goog.require('ol.Object');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Object.<string, *>=} opt_values Attributes.
 */
ol.Feature = function(opt_values) {

  goog.base(this, opt_values);

  /**
   * @type {string|undefined}
   * @private
   */
  this.geometryName_;

  /**
   * @type {Array.<ol.style.Symbolizer>}
   * @private
   */
  this.symbolizers_ = null;

};
goog.inherits(ol.Feature, ol.Object);


/**
 * @return {Object.<string, *>} Attributes object.
 */
ol.Feature.prototype.getAttributes = function() {
  var keys = this.getKeys(),
      len = keys.length,
      attributes = {},
      i, key;
  for (i = 0; i < len; ++ i) {
    key = keys[i];
    attributes[key] = this.get(key);
  }
  return attributes;
};


/**
 * @return {ol.geom.Geometry} The geometry (or null if none).
 */
ol.Feature.prototype.getGeometry = function() {
  return goog.isDef(this.geometryName_) ?
      /** @type {ol.geom.Geometry} */ (this.get(this.geometryName_)) :
      null;
};


/**
 * @return {Array.<ol.style.SymbolizerLiteral>} Symbolizer literals.
 */
ol.Feature.prototype.getSymbolizerLiterals = function() {
  var symbolizerLiterals = null;
  if (!goog.isNull(this.symbolizers_)) {
    var numSymbolizers = this.symbolizers_.length;
    symbolizerLiterals = new Array(numSymbolizers);
    for (var i = 0; i < numSymbolizers; ++i) {
      symbolizerLiterals[i] = this.symbolizers_[i].createLiteral(this);
    }
  }
  return symbolizerLiterals;
};


/**
 * @inheritDoc
 * @param {string} key Key.
 * @param {*} value Value.
 */
ol.Feature.prototype.set = function(key, value) {
  if (!goog.isDef(this.geometryName_) && (value instanceof ol.geom.Geometry)) {
    this.geometryName_ = key;
  }
  goog.base(this, 'set', key, value);
};


/**
 * @param {ol.geom.Geometry} geometry The geometry.
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  if (!goog.isDef(this.geometryName_)) {
    this.geometryName_ = ol.Feature.DEFAULT_GEOMETRY;
  }
  this.set(this.geometryName_, geometry);
};


/**
 * @param {Array.<ol.style.Symbolizer>} symbolizers Symbolizers for this
 *     features. If set, these take precedence over layer style.
 */
ol.Feature.prototype.setSymbolizers = function(symbolizers) {
  this.symbolizers_ = symbolizers;
};


/**
 * @const
 * @type {string}
 */
ol.Feature.DEFAULT_GEOMETRY = 'geometry';
