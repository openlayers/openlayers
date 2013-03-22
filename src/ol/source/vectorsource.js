goog.provide('ol.source.Vector');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.ProjectionLike');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SharedVertices');
goog.require('ol.parser.Parser');
goog.require('ol.projection');
goog.require('ol.source.Source');
goog.require('ol.structs.RTree');



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
    var geometryType = geometry.getType();
    this.geometryTypeIndex_[geometryType][id] = feature;
    this.rTree_.put(geometry.getBounds(),
        feature, geometryType);
  }
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 */
ol.source.FeatureCache.prototype.getFeaturesObject = function(opt_filter) {
  var i, features;
  if (!goog.isDef(opt_filter)) {
    features = this.idLookup_;
  } else {
    if (opt_filter instanceof ol.filter.Geometry) {
      features = this.geometryTypeIndex_[opt_filter.getType()];
    } else if (opt_filter instanceof ol.filter.Extent) {
      features = this.rTree_.find(opt_filter.getExtent());
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
          features = this.rTree_.find(
              extentFilter.getExtent(), geometryFilter.getType());
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
        if (opt_filter.applies(feature) === true) {
          features[i] = feature;
        }
      }
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
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.SourceOptions} options Source options.
 */
ol.source.Vector = function(options) {
  goog.base(this, options);

  /**
   * TODO: this means we need to know dimension at construction
   * @type {ol.geom.SharedVertices}
   * @private
   */
  this.pointVertices_ = new ol.geom.SharedVertices();

  /**
   * TODO: this means we need to know dimension at construction
   * @type {ol.geom.SharedVertices}
   * @private
   */
  this.lineVertices_ = new ol.geom.SharedVertices();

  /**
   * TODO: this means we need to know dimension at construction
   * @type {ol.geom.SharedVertices}
   * @private
   */
  this.polygonVertices_ = new ol.geom.SharedVertices();

  /**
   * @type {ol.source.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.source.FeatureCache();

  /**
   * @private
   * @type {boolean}
   */
  this.ready_ = false;

};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * @param {Array.<ol.Feature>} features Array of features.
 */
ol.source.Vector.prototype.addFeatures = function(features) {
  for (var i = 0, ii = features.length; i < ii; ++i) {
    this.featureCache_.add(features[i]);
  }
  // TODO: events for real - listeners want features and extent here
  this.ready_ = true;
  this.dispatchLoadEvent();
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.source.Vector.prototype.getFeatures = function(opt_filter) {
  return goog.object.getValues(
      this.featureCache_.getFeaturesObject(opt_filter));
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.source.Vector.prototype.getFeaturesObject = function(opt_filter) {
  return this.featureCache_.getFeaturesObject(opt_filter);
};


/**
 * @return {ol.geom.SharedVertices} Shared line vertices.
 */
ol.source.Vector.prototype.getLineVertices = function() {
  return this.lineVertices_;
};


/**
 * @return {ol.geom.SharedVertices} Shared point vertices.
 */
ol.source.Vector.prototype.getPointVertices = function() {
  return this.pointVertices_;
};


/**
 * @return {ol.geom.SharedVertices} Shared polygon vertices.
 */
ol.source.Vector.prototype.getPolygonVertices = function() {
  return this.polygonVertices_;
};


/**
 * @inheritDoc
 */
ol.source.Vector.prototype.isReady = function() {
  return this.ready_;
};


/**
 * @param {Object|Element|Document|string} data Feature data.
 * @param {ol.parser.Parser} parser Feature parser.
 * @param {ol.ProjectionLike=} opt_projection Data projection.
 */
ol.source.Vector.prototype.parseFeatures =
    function(data, parser, opt_projection) {
  var features;

  var lookup = {
    'point': this.pointVertices_,
    'linestring': this.lineVertices_,
    'polygon': this.polygonVertices_,
    'multipoint': this.pointVertices_,
    'multilinstring': this.lineVertices_,
    'multipolygon': this.polygonVertices_
  };

  var callback = function(feature, type) {
    return lookup[type];
  };
  if (goog.isString(data)) {
    goog.asserts.assert(goog.isFunction(parser.readFeaturesFromString),
        'Expected a parser with readFeaturesFromString method.');
    features = parser.readFeaturesFromString(data, {callback: callback});
  } else if (goog.isObject(data)) {
    goog.asserts.assert(goog.isFunction(parser.readFeaturesFromObject),
        'Expected a parser with a readFeaturesFromObject method.');
    features = parser.readFeaturesFromObject(data, {callback: callback});
  } else {
    // TODO: parse more data types
    throw new Error('Data type not supported: ' + data);
  }

  var projection = this.getProjection();
  if (!goog.isNull(projection) && goog.isDefAndNotNull(opt_projection)) {
    var transform = ol.projection.getTransform(opt_projection, projection);
    transform(
        this.pointVertices_.coordinates,
        this.pointVertices_.coordinates,
        this.pointVertices_.getDimension());
    transform(
        this.lineVertices_.coordinates,
        this.lineVertices_.coordinates,
        this.lineVertices_.getDimension());
    transform(
        this.polygonVertices_.coordinates,
        this.polygonVertices_.coordinates,
        this.polygonVertices_.getDimension());
  }

  this.addFeatures(features);
};
