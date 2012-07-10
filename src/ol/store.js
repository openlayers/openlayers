goog.provide('ol.Store');

goog.require('ol.Extent');
goog.require('ol.Object');
goog.require('ol.Projection');


/**
 * @enum {string}
 * @private
 */
ol.StoreProperty_ = {
  ATTRIBUTION: 'attribution',
  EXTENT: 'extent',
  PROJECTION: 'projection'
};



/**
 * @constructor
 * @extends {ol.Object}
 */
ol.Store = function() {

  goog.base(this);

  this.setExtent(null);
  this.setProjection(null);

};
goog.inherits(ol.Store, ol.Object);


/**
 * @return {string|undefined} Attribution.
 */
ol.Store.prototype.getAttribution = function() {
  return /** @type {string} */ (this.get(ol.StoreProperty_.ATTRIBUTION));
};


/**
 * @return {ol.Extent} Extent.
 */
ol.Store.prototype.getExtent = function() {
  return /** @type {ol.Extent} */ (this.get(ol.StoreProperty_.EXTENT));
};


/**
 * @return {ol.Projection} Projection.
 */
ol.Store.prototype.getProjection = function() {
  return /** @type {ol.Projection} */ (this.get(ol.StoreProperty_.PROJECTION));
};


/**
 * @param {string|undefined} attribution Attribution.
 */
ol.Store.prototype.setAttribution = function(attribution) {
  this.set(ol.StoreProperty_.ATTRIBUTION, attribution);
};


/**
 * @param {ol.Extent} extent Extent.
 */
ol.Store.prototype.setExtent = function(extent) {
  this.set(ol.StoreProperty_.EXTENT, extent);
};


/**
 * @param {ol.Projection} projection Projetion.
 */
ol.Store.prototype.setProjection = function(projection) {
  this.set(ol.StoreProperty_.PROJECTION, projection);
};
