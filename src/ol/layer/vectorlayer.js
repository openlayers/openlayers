goog.provide('ol.layer.Vector');

goog.require('goog.events.EventType');
goog.require('ol.Feature');
goog.require('ol.geom.SharedVertices');
goog.require('ol.layer.Layer');
goog.require('ol.projection');
goog.require('ol.source.Vector');
goog.require('ol.structs.RTree');
goog.require('ol.style.Style');



/**
 * @constructor
 */
ol.layer.FeatureCache = function() {

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
ol.layer.FeatureCache.prototype.clear = function() {
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
ol.layer.FeatureCache.prototype.add = function(feature) {
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
ol.layer.FeatureCache.prototype.getFeaturesObject_ = function(opt_filter) {
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
        if (opt_filter.applies(feature) === true) {
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
ol.layer.FeatureCache.prototype.getFeatures = function(opt_filter) {
  return goog.object.getValues(this.getFeaturesObject_(opt_filter));
};


/**
 * @param {ol.filter.Geometry} filter Geometry type filter.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.layer.FeatureCache.prototype.getFeaturesByGeometryType_ = function(filter) {
  return goog.object.getValues(this.geometryTypeIndex_[filter.getType()]);
};


/**
 * Get features by ids.
 * @param {Array.<string>} ids Array of (internal) identifiers.
 * @return {Array.<ol.Feature>} Array of features.
 * @private
 */
ol.layer.FeatureCache.prototype.getFeaturesByIds_ = function(ids) {
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
 * @extends {ol.layer.Layer}
 * @param {ol.layer.LayerOptions} layerOptions Layer options.
 */
ol.layer.Vector = function(layerOptions) {
  goog.base(this, layerOptions);

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = goog.isDef(layerOptions.style) ? layerOptions.style : null;

  /**
   * @type {ol.layer.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.layer.FeatureCache();

};
goog.inherits(ol.layer.Vector, ol.layer.Layer);


/**
 * @param {Array.<ol.Feature>} features Array of features.
 */
ol.layer.Vector.prototype.addFeatures = function(features) {
  for (var i = 0, ii = features.length; i < ii; ++i) {
    this.featureCache_.add(features[i]);
  }
  // TODO: events for real - listeners want features and extent here
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * @param {ol.filter.Filter=} opt_filter Optional filter.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.layer.Vector.prototype.getFeatures = function(opt_filter) {
  return this.featureCache_.getFeatures(opt_filter);
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {Array.<Array>} symbolizers for features.
 */
ol.layer.Vector.prototype.groupFeaturesBySymbolizerLiteral =
    function(features) {
  var uniqueLiterals = {},
      featuresBySymbolizer = [],
      style = this.style_,
      numFeatures = features.length,
      i, j, l, feature, literals, numLiterals, literal, uniqueLiteral, key;
  for (i = 0; i < numFeatures; ++i) {
    feature = features[i];
    literals = feature.getSymbolizerLiterals();
    if (goog.isNull(literals)) {
      literals = goog.isNull(style) ?
          ol.style.Style.applyDefaultStyle(feature) :
          style.apply(feature);
    }
    numLiterals = literals.length;
    for (j = 0; j < numLiterals; ++j) {
      literal = literals[j];
      for (l in uniqueLiterals) {
        uniqueLiteral = featuresBySymbolizer[uniqueLiterals[l]][1];
        if (literal.equals(uniqueLiteral)) {
          literal = uniqueLiteral;
          break;
        }
      }
      key = goog.getUid(literal);
      if (!goog.object.containsKey(uniqueLiterals, key)) {
        uniqueLiterals[key] = featuresBySymbolizer.length;
        featuresBySymbolizer.push([[], literal]);
      }
      featuresBySymbolizer[uniqueLiterals[key]][0].push(feature);
    }
  }
  return featuresBySymbolizer;
};


/**
 * @param {Object|Element|Document|string} data Feature data.
 * @param {ol.parser.Parser} parser Feature parser.
 * @param {ol.Projection} projection This sucks.  The layer should be a view in
 *     one projection.
 */
ol.layer.Vector.prototype.parseFeatures = function(data, parser, projection) {
  var features;
  var pointVertices = new ol.geom.SharedVertices();
  var lineVertices = new ol.geom.SharedVertices();
  var polygonVertices = new ol.geom.SharedVertices();

  var lookup = {
    'point': pointVertices,
    'linestring': lineVertices,
    'polygon': polygonVertices,
    'multipoint': pointVertices,
    'multilinstring': lineVertices,
    'multipolygon': polygonVertices
  };

  var callback = function(feature, type) {
    return lookup[type];
  };
  if (typeof data === 'string') {
    goog.asserts.assert(typeof parser.readFeaturesFromString === 'function',
        'Expected a parser with readFeaturesFromString method.');
    features = parser.readFeaturesFromString(data, {callback: callback});
  } else {
    // TODO: parse more data types
    throw new Error('Data type not supported: ' + data);
  }
  var sourceProjection = this.getSource().getProjection();
  var transform = ol.projection.getTransform(sourceProjection, projection);

  transform(
      pointVertices.coordinates,
      pointVertices.coordinates,
      pointVertices.getDimension());

  transform(
      lineVertices.coordinates,
      lineVertices.coordinates,
      lineVertices.getDimension());

  transform(
      polygonVertices.coordinates,
      polygonVertices.coordinates,
      polygonVertices.getDimension());

  this.addFeatures(features);
};


goog.require('ol.filter.Extent');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
