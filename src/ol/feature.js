goog.provide('ol.Feature');

goog.require('ol.Object');
goog.require('ol.geom.Geometry');



/**
 * @constructor
 * @extends {ol.Object}
 * @param {Object=} opt_values Attributes.
 */
ol.Feature = function(opt_values) {

  goog.base(this, opt_values);

  /**
   * @type {string|undefined}
   * @private
   */
  this.geometryName_;

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
  return goog.isDef(this.geometryName_) ?
      /** @type {ol.geom.Geometry} */ (this.get(this.geometryName_)) :
      null;
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
 * @const
 * @type {string}
 */
ol.Feature.DEFAULT_GEOMETRY = 'geometry';
