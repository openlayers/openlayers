goog.provide('ol.structs.CollectionRBush');

goog.require('ol.Collection');



/**
 * Implements the RBush interface but uses an ol.Collection internally.
 * This is used to easily bypass a spatial index on a vector source.
 *
 * @constructor
 * @struct
 * @template T
 */
ol.structs.CollectionRBush = function() {

  /**
   * @private
   */
  this.collection_ = new ol.Collection();

};


/**
 * Insert a value into the Collection.
 * @param {ol.Extent} extent Extent.
 * @param {T} value Value.
 */
ol.structs.CollectionRBush.prototype.insert = function(extent, value) {
  this.collection_.push(value);
};


/**
 * Bulk-insert values into the Collection.
 * @param {Array.<ol.Extent>} extents Extents.
 * @param {Array.<T>} values Values.
 */
ol.structs.CollectionRBush.prototype.load = function(extents, values) {
  this.collection_.extend(values);
};


/**
 * Calls a callback function with each value in the collection.
 * If the callback returns a truthy value, this value is returned without
 * checking the rest of the collection.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.CollectionRBush.prototype.forEach = function(callback, opt_this) {
  this.collection_.forEach(callback, opt_this);
};


/**
 * Remove all values from the Collection.
 */
ol.structs.CollectionRBush.prototype.clear = function() {
  this.collection_.clear();
};


/**
 * Calls a callback function with each value in the provided extent.
 * @param {ol.Extent} extent Extent.
 * @param {function(this: S, T): *} callback Callback.
 * @param {S=} opt_this The object to use as `this` in `callback`.
 * @return {*} Callback return value.
 * @template S
 */
ol.structs.CollectionRBush.prototype.forEachInExtent =
    function(extent, callback, opt_this) {
  this.collection_.forEach(function(feature) {
    if (feature.getGeometry().intersectsExtent(extent)) {
      return callback.call(opt_this, feature);
    }
  });
};


/**
 * Return all values in the Collection.
 * @return {Array.<T>} All.
 */
ol.structs.CollectionRBush.prototype.getAll = function() {
  return this.collection_.getArray();
};


/**
 * Return all values in the given extent.
 * @param {ol.Extent} extent Extent.
 * @return {Array.<T>} All in extent.
 */
ol.structs.CollectionRBush.prototype.getInExtent = function(extent) {
  var features = [];
  this.collection_.forEach(function(feature) {
    if (feature.getGeometry().intersectsExtent(extent)) {
      features.push(feature);
    }
  });
  return features;
};
