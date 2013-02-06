goog.provide('ol.source.Vector');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.Projection');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Filter');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.geom.GeometryType');
goog.require('ol.source.TileSource');
goog.require('ol.structs.RTree');
goog.require('ol.tilegrid.TileGrid');



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
   * @type {Object.<ol.Feature>}
   * @private
   */
  this.geometryTypeIndex_;

  /**
   * @type {ol.structs.RTree}
   * @private
   */
  this.rTree_;

  this.clear();

};


/**
 * Clear the cache.
 */
ol.source.FeatureCache.prototype.clear = function() {
  this.idLookup_ = {};

  var geometryTypeIndex = {};
  for (var key in ol.geom.GeometryType) {
    geometryTypeIndex[ol.geom.GeometryType[key]] = {};
  }
  this.geometryTypeIndex_ = geometryTypeIndex;

  this.rTree_ = new ol.structs.RTree();
};


/**
 * Add a feature to the cache.
 * @param {ol.Feature} feature Feature to be cached.
 */
ol.source.FeatureCache.prototype.add = function(feature) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  this.idLookup_[id] = feature;

  // index by geometry type and bounding box
  if (!goog.isNull(geometry)) {
    this.geometryTypeIndex_[geometry.getType()][id] = feature;
    this.rTree_.put(geometry.getBounds(), feature);
  }
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 * @private
 */
ol.source.FeatureCache.prototype.getFeaturesObject_ = function(opt_filter) {
  var features;
  if (!goog.isDef(opt_filter)) {
    features = this.idLookup_;
  } else {
    if (opt_filter instanceof ol.filter.Logical) {
      features = {};
      var filters = opt_filter.getFilters(),
          filterFeatures, key, or;
      for (var i = filters.length - 1; i >= 0; --i) {
        filterFeatures = this.getFeaturesObject_(filters[i]);
        goog.object.extend(features, filterFeatures);
        if (opt_filter.operator === ol.filter.LogicalOperator.AND) {
          or = features;
          features = {};
          for (key in or) {
            if (filterFeatures[key]) {
              features[key] = or[key];
            }
          }
        }
      }
    } else if (opt_filter instanceof ol.filter.Geometry) {
      features = this.geometryTypeIndex_[opt_filter.getType()];
    } else if (opt_filter instanceof ol.filter.Extent) {
      features = this.rTree_.find(opt_filter.getExtent());
    } else {
      // TODO: support other filter types
      throw new Error('Filter type not supported: ' + opt_filter);
    }
  }
  return features;
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.source.FeatureCache.prototype.getFeatures = function(opt_filter) {
  return goog.object.getValues(this.getFeaturesObject_(opt_filter));
};


/**
 * @param {ol.filter.Geometry} filter Geometry type filter.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.source.FeatureCache.prototype.getFeaturesByGeometryType_ = function(filter) {
  return goog.object.getValues(this.geometryTypeIndex_[filter.getType()]);
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
 *            projection: (ol.Projection|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 */
ol.source.VectorOptions;



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.VectorOptions} options Source options.
 */
ol.source.Vector = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

  /**
   * @type {ol.source.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.source.FeatureCache();

};
goog.inherits(ol.source.Vector, ol.source.TileSource);


/**
 * @param {ol.tilegrid.TileGrid} tileGrid tile grid.
 */
ol.source.Vector.prototype.setTileGrid = function(tileGrid) {
  this.tileGrid = tileGrid;
};


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
