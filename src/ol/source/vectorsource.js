goog.provide('ol.source.Vector');

goog.require('ol.Feature');
goog.require('ol.filter.Filter');
goog.require('ol.filter.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.source.Source');



/**
 * @constructor
 */
ol.source.FeatureCache = function() {

  /**
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.idLookup_;


  /**
   * @type {Object.<string, Array.<string>>}
   * @private
   */
  this.geometryTypeIndex_;

  this.clear();

};


/**
 * Clear the cache.
 */
ol.source.FeatureCache.prototype.clear = function() {
  this.idLookup_ = {};

  var geometryTypeIndex_ = {};
  for (var key in ol.geom.GeometryType) {
    geometryTypeIndex_[ol.geom.GeometryType[key]] = [];
  }
  this.geometryTypeIndex_ = geometryTypeIndex_;
};


/**
 * Add a feature to the cache.
 * @param {ol.Feature} feature Feature to be cached.
 */
ol.source.FeatureCache.prototype.add = function(feature) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  this.idLookup_[id] = feature;

  // index by geometry type
  if (!goog.isNull(geometry)) {
    this.geometryTypeIndex_[geometry.getType()].push(id);
  }

  /**
   * TODO: Index by tile coord.  To do this for real requires knowledge about
   * the evaluated symbolizer literal for each feature.  Initially, a pixel
   * buffer could be provided.
   */

};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.source.FeatureCache.prototype.getFeatures = function(opt_filter) {
  var features;
  if (!goog.isDef(opt_filter)) {
    features = new Array();
    for (var id in this.idLookup_) {
      features.push(this.idLookup_[id]);
    }
  } else {
    if (opt_filter instanceof ol.filter.Geometry) {
      features = this.getFeaturesByGeometryType_(
          /** @type {ol.filter.Geometry} */ (opt_filter));
    } else {
      // TODO: support other filter types
      throw new Error('Filter type not supported: ' + opt_filter);
    }
  }
  return features;
};


/**
 * @param {ol.filter.Geometry} filter Geometry type filter.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.source.FeatureCache.prototype.getFeaturesByGeometryType_ = function(filter) {
  var type = filter.getType(),
      ids = this.geometryTypeIndex_[filter.getType()];

  return this.getFeaturesByIds_(ids);
};


/**
 * Get features by ids.
 * @param {Array.<string>} ids Array of (internal) identifiers.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.source.FeatureCache.prototype.getFeaturesByIds_ = function(ids) {
  var len = ids.length,
      features = new Array(len),
      i;
  for (i = 0; i < len; ++i) {
    features[i] = this.idLookup_[ids[i]];
  }
  return features;
};


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined)}}
 */
ol.source.VectorOptions;



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorOptions} options Source options.
 */
ol.source.Vector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection
  });

  /**
   * @type {ol.source.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.source.FeatureCache();

};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * @param {Array.<ol.Feature>} features Array of features.
 */
ol.source.Vector.prototype.addFeatures = function(features) {
  for (var i = 0, ii = features.length; i < ii; ++i) {
    this.featureCache_.add(features[i]);
  }
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.source.Vector.prototype.getFeatures = function(opt_filter) {
  return this.featureCache_.getFeatures(opt_filter);
};
