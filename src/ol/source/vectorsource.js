// FIXME bulk feature upload - suppress events
// FIXME put features in an ol.Collection
// FIXME make change-detection more refined (notably, geometry hint)

goog.provide('ol.source.Vector');
goog.provide('ol.source.VectorEvent');
goog.provide('ol.source.VectorEventType');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('ol.source.Source');
goog.require('ol.structs.RBush');


/**
 * @enum {string}
 */
ol.source.VectorEventType = {
  ADDFEATURE: 'addfeature',
  REMOVEFEATURE: 'removefeature'
};



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorOptions=} opt_options Options.
 */
ol.source.Vector = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    state: options.state
  });

  /**
   * @private
   * @type {ol.structs.RBush.<ol.Feature>}
   */
  this.rBush_ = new ol.structs.RBush();

  /**
   * @private
   * @type {Object.<string, goog.events.Key>}
   */
  this.featureChangeKeys_ = {};

  if (goog.isDef(options.features)) {
    var features = options.features;
    var i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      this.addFeature(features[i]);
    }
  }

};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * @param {ol.Feature} feature Feature.
 */
ol.source.Vector.prototype.addFeature = function(feature) {
  var featureKey = goog.getUid(feature) + '';
  goog.asserts.assert(!(featureKey in this.featureChangeKeys_));
  this.featureChangeKeys_[featureKey] = goog.events.listen(feature,
      goog.events.EventType.CHANGE, this.handleFeatureChange_, false, this);
  var extent = feature.getGeometry().getExtent();
  this.rBush_.insert(extent, feature);
  this.dispatchEvent(
      new ol.source.VectorEvent(ol.source.VectorEventType.ADDFEATURE, feature));
  this.dispatchChangeEvent();
};


/**
 * @param {function(this: T, ol.Feature): S} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @return {S|undefined}
 * @template T,S
 */
ol.source.Vector.prototype.forEachFeature = function(f, opt_obj) {
  return this.rBush_.forEach(f, opt_obj);
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {function(this: T, ol.Feature): S} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @return {S|undefined}
 * @template T,S
 */
ol.source.Vector.prototype.forEachFeatureAtCoordinate =
    function(coordinate, f, opt_obj) {
  var extent = [coordinate[0], coordinate[1], coordinate[0], coordinate[1]];
  return this.forEachFeatureInExtent(extent, function(feature) {
    if (feature.getGeometry().containsCoordinate(coordinate)) {
      return f.call(opt_obj, feature);
    } else {
      return undefined;
    }
  });
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {function(this: T, ol.Feature): S} f Callback.
 * @param {T=} opt_obj The object to be used as the value of 'this' within f.
 * @return {S|undefined}
 * @template T,S
 */
ol.source.Vector.prototype.forEachFeatureInExtent =
    function(extent, f, opt_obj) {
  return this.rBush_.forEachInExtent(extent, f, opt_obj);
};


/**
 * @return {Array.<ol.Feature>} Features.
 */
ol.source.Vector.prototype.getAllFeatures = function() {
  return this.rBush_.getAll();
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {Array.<ol.Feature>} Features.
 */
ol.source.Vector.prototype.getAllFeaturesAtCoordinate = function(coordinate) {
  var features = [];
  this.forEachFeatureAtCoordinate(coordinate, function(feature) {
    features.push(feature);
  });
  return features;
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {Array.<ol.Feature>} Features.
 */
ol.source.Vector.prototype.getAllFeaturesInExtent = function(extent) {
  return this.rBush_.getAllInExtent(extent);
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.source.Vector.prototype.handleFeatureChange_ = function(event) {
  var feature = /** @type {ol.Feature} */ (event.target);
  this.rBush_.update(feature.getGeometry().getExtent(), feature);
  this.dispatchChangeEvent();
};


/**
 * @return {boolean} Is empty.
 */
ol.source.Vector.prototype.isEmpty = function() {
  return this.rBush_.isEmpty();
};


/**
 * @param {ol.Feature} feature Feature.
 */
ol.source.Vector.prototype.removeFeature = function(feature) {
  this.rBush_.remove(feature);
  var featureKey = goog.getUid(feature) + '';
  goog.asserts.assert(featureKey in this.featureChangeKeys_);
  goog.events.unlistenByKey(this.featureChangeKeys_[featureKey]);
  delete this.featureChangeKeys_[featureKey];
  this.dispatchEvent(new ol.source.VectorEvent(
      ol.source.VectorEventType.REMOVEFEATURE, feature));
  this.dispatchChangeEvent();
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Type.
 * @param {ol.Feature=} opt_feature Feature.
 */
ol.source.VectorEvent = function(type, opt_feature) {

  goog.base(this, type);

  /**
   * @private
   * @type {ol.Feature|undefined}
   */
  this.feature_ = opt_feature;

};
goog.inherits(ol.source.VectorEvent, goog.events.Event);


/**
 * @return {ol.Feature|undefined} Feature.
 */
ol.source.VectorEvent.prototype.getFeature = function() {
  return this.feature_;
};
