goog.provide('ol.source.Vector');

goog.require('ol.Attribution');
goog.require('ol.Extent');
goog.require('ol.Feature');
goog.require('ol.Projection');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Filter');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
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
   * @type {Object.<string, ol.Feature>}
   * @private
   */
  this.geometryTypeIndex_;

  /**
   * @type {Object.<ol.geom.GeometryType, ol.structs.RTree>}
   * @private
   */
  this.boundsByGeometryType_;

  this.clear();

};


/**
 * Clear the cache.
 */
ol.source.FeatureCache.prototype.clear = function() {
  this.idLookup_ = {};

  var geometryTypeIndex = {},
      boundsByGeometryType = {},
      geometryType;
  for (var key in ol.geom.GeometryType) {
    geometryType = ol.geom.GeometryType[key];
    geometryTypeIndex[geometryType] = {};
    boundsByGeometryType[geometryType] = new ol.structs.RTree();
  }
  this.geometryTypeIndex_ = geometryTypeIndex;
  this.boundsByGeometryType_ = boundsByGeometryType;
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
    var geometryType = geometry.getType();
    this.geometryTypeIndex_[geometryType][id] = feature;
    this.boundsByGeometryType_[geometryType].put(geometry.getBounds(),
        feature);
  }
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 * @private
 */
ol.source.FeatureCache.prototype.getFeaturesObject_ = function(opt_filter) {
  var i, features;
  if (!goog.isDef(opt_filter)) {
    features = this.idLookup_;
  } else {
    if (opt_filter instanceof ol.filter.Geometry) {
      features = this.geometryTypeIndex_[opt_filter.getType()];
    } else if (opt_filter instanceof ol.filter.Extent) {
      var boundsByGeometryType = this.boundsByGeometryType_,
          extent = opt_filter.getExtent();
      features = {};
      for (i in boundsByGeometryType) {
        goog.object.extend(features, boundsByGeometryType[i].find(extent));
      }
    } else if (opt_filter instanceof ol.filter.Logical &&
        opt_filter.operator === ol.filter.LogicalOperator.AND) {
      var filters = opt_filter.getFilters();
      if (filters.length === 2) {
        var filter, geometryFilter, extentFilter;
        for (i = 0; i <= 1; ++i) {
          filter = filters[i];
          if (filter instanceof ol.filter.Geometry) {
            geometryFilter = filter;
          } else if (filter instanceof ol.filter.Extent) {
            extentFilter = filter;
          }
        }
        if (extentFilter && geometryFilter) {
          features = this.boundsByGeometryType_[geometryFilter.getType()]
              .find(extentFilter.getExtent());
        }
      }
    }
    if (!goog.isDef(features)) {
      // TODO: support fast lane for other filter types
      var candidates = this.idLookup_,
          feature;
      features = {};
      for (i in candidates) {
        feature = candidates[i];
        if (opt_filter.evaluate(feature) === true) {
          features[i] = feature;
        }
      }
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
