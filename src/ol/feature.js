goog.provide('ol.Feature');

goog.require('ol.Object');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.geom.Geometry=} opt_geometry Geometry.
 * @param {Object=} opt_values Attributes.
 */
ol.Feature = function(opt_geometry, opt_values) {

  goog.base(this, opt_values);

  /**
   * @private
   * @type {ol.geom.Geometry}
   */
  this.geometry_ = goog.isDef(opt_geometry) ? opt_geometry : null;

};
goog.inherits(ol.Feature, ol.Object);


/**
 * @return {Object} Attributes object.
 */
ol.Feature.prototype.getAttributes = function() {
  // TODO: see https://github.com/openlayers/ol3/pull/217
  // var keys = this.getKeys(),
  //     len = keys.length,
  //     attributes = {},
  //     i, key
  // for (var i = 0; i < len; ++ i) {
  //   key = keys[i];
  //   attributes[key] = this.get(key);
  // }
  // return attributes;
  return this;
};


/**
 * @return {ol.geom.Geometry} The geometry (or null if none).
 */
ol.Feature.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * @param {ol.geom.Geometry} geometry The geometry.
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.geometry_ = geometry;
};
