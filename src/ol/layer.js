goog.provide('ol.Layer');

goog.require('ol.Extent');
goog.require('ol.Object');
goog.require('ol.Projection');


/**
 * @enum {string}
 * @private
 */
ol.LayerProperty_ = {
  ATTRIBUTION: 'attribution',
  EXTENT: 'extent',
  PROJECTION: 'projection'
};



/**
 * @constructor
 * @extends {ol.Object}
 */
ol.Layer = function() {

  goog.base(this);

};
goog.inherits(ol.Layer, ol.Object);


/**
 * @return {string} Attribution.
 */
ol.Layer.prototype.getAttribution = function() {
  return /** @type {string} */ (this.get(ol.LayerProperty_.ATTRIBUTION));
};


/**
 * @return {ol.Extent} Extent.
 */
ol.Layer.prototype.getExtent = function() {
  return /** @type {ol.Extent} */ (this.get(ol.LayerProperty_.EXTENT));
};


/**
 * @return {ol.Projection} Projection.
 */
ol.Layer.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ (this.get(ol.LayerProperty_.PROJECTION));
};


/**
 * @param {string} attribution Attribution.
 */
ol.Layer.prototype.setAttribution = function(attribution) {
  this.set(ol.LayerProperty_.ATTRIBUTION, attribution);
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.Layer.prototype.setExtent = function(extent) {
  this.set(ol.LayerProperty_.EXTENT, extent);
};


/**
 * @param {ol.Projection} projection Projetion.
 */
ol.Layer.prototype.setProjection = function(projection) {
  this.set(ol.LayerProperty_.PROJECTION, projection);
};
