// FIXME put features in an ol.Collection
// FIXME make change-detection more refined (notably, geometry hint)
// FIXME keep R-Tree up-to-date, probably needs a new R-Tree implementation

goog.provide('ol.source.Vector');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('ol.source.Source');
goog.require('ol.structs.RTree');



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
   * @type {ol.structs.RTree}
   */
  this.rTree_ = new ol.structs.RTree();

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
  this.rTree_.insert(extent, feature);
  this.dispatchChangeEvent();
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {function(this: T, ol.Feature): S} f Callback.
 * @param {T=} opt_obj The object to be used a the value of 'this' within f.
 * @return {S|undefined}
 * @template T,S
 */
ol.source.Vector.prototype.forEachFeatureInExtent =
    function(extent, f, opt_obj) {
  var features = this.getAllFeaturesInExtent(extent);
  var i, ii;
  for (i = 0, ii = features.length; i < ii; ++i) {
    var result = f.call(opt_obj, features[i]);
    if (result) {
      return result;
    }
  }
  return undefined;
};


/**
 * @param {ol.Extent} extent Extent.
 * @return {Array.<ol.Feature>} Features.
 */
ol.source.Vector.prototype.getAllFeaturesInExtent = function(extent) {
  return this.rTree_.search(extent);
};


/**
 * @param {goog.events.Event} event Event.
 * @private
 */
ol.source.Vector.prototype.handleFeatureChange_ = function(event) {
  //var feature = /** @type {ol.Feature} */ (event.target);
  // FIXME keep R-Tree up to date
  this.dispatchChangeEvent();
};


/**
 * @param {ol.Feature} feature Feature.
 */
ol.source.Vector.prototype.removeFeature = function(feature) {
  var extent = feature.getGeometry().getExtent();
  this.rTree_.remove(extent, feature);
  var featureKey = goog.getUid(feature) + '';
  goog.asserts.assert(featureKey in this.featureChangeKeys_);
  goog.events.unlistenByKey(this.featureChangeKeys_[featureKey]);
  delete this.featureChangeKeys_[featureKey];
  this.dispatchChangeEvent();
};
