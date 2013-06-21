goog.provide('ol.layer.Vector');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.expr');
goog.require('ol.expr.Literal');
goog.require('ol.expr.Logical');
goog.require('ol.expr.LogicalOp');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.SharedVertices');
goog.require('ol.layer.Layer');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.structs.RTree');
goog.require('ol.style.Style');
goog.require('ol.style.TextLiteral');



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
   * @type {ol.structs.RTree}
   * @private
   */
  this.rTree_;

  this.clear();

};


/**
 * Clear the cache.
 */
ol.layer.FeatureCache.prototype.clear = function() {
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
ol.layer.FeatureCache.prototype.add = function(feature) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  this.idLookup_[id] = feature;

  // index by geometry type and bounding box
  if (!goog.isNull(geometry)) {
    var geometryType = geometry.getType();
    this.geometryTypeIndex_[geometryType][id] = feature;
    this.rTree_.insert(geometry.getBounds(),
        feature, geometryType);
  }
};


/**
 * @param {ol.expr.Expression=} opt_expr Expression for filtering.
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 */
ol.layer.FeatureCache.prototype.getFeaturesObject = function(opt_expr) {
  var features;
  if (!goog.isDef(opt_expr)) {
    features = this.idLookup_;
  } else {
    // check for geometryType or extent expression
    var name = ol.expr.isLibCall(opt_expr);
    if (name === 'geometryType') {
      var args = /** @type {ol.expr.Call} */ (opt_expr).getArgs();
      goog.asserts.assert(args.length === 1);
      goog.asserts.assert(args[0] instanceof ol.expr.Literal);
      var type = /** @type {ol.expr.Literal } */ (args[0]).evaluate();
      goog.asserts.assertString(type);
      features = this.geometryTypeIndex_[type];
    } else if (name === 'extent') {
      var args = /** @type {ol.expr.Call} */ (opt_expr).getArgs();
      goog.asserts.assert(args.length === 4);
      var extent = [];
      for (var i = 0; i < 4; ++i) {
        goog.asserts.assert(args[i] instanceof ol.expr.Literal);
        extent[i] = /** @type {ol.expr.Literal} */ (args[i]).evaluate();
        goog.asserts.assertNumber(extent[i]);
      }
      features = this.rTree_.searchReturningObject(extent);
    } else {
      // not a call expression, check logical
      if (opt_expr instanceof ol.expr.Logical) {
        var op = /** @type {ol.expr.Logical} */ (opt_expr).getOperator();
        if (op === ol.expr.LogicalOp.AND) {
          var expressions = [opt_expr.getLeft(), opt_expr.getRight()];
          var expr, args, type, extent;
          for (var i = 0; i <= 1; ++i) {
            expr = expressions[i];
            name = ol.expr.isLibCall(expr);
            if (name === 'geometryType') {
              args = /** @type {ol.expr.Call} */ (expr).getArgs();
              goog.asserts.assert(args.length === 1);
              goog.asserts.assert(args[0] instanceof ol.expr.Literal);
              type = /** @type {ol.expr.Literal } */ (args[0]).evaluate();
              goog.asserts.assertString(type);
            } else if (name === 'extent') {
              args = /** @type {ol.expr.Call} */ (expr).getArgs();
              goog.asserts.assert(args.length === 4);
              extent = [];
              for (var j = 0; j < 4; ++j) {
                goog.asserts.assert(args[j] instanceof ol.expr.Literal);
                extent[j] =
                    /** @type {ol.expr.Literal} */ (args[j]).evaluate();
                goog.asserts.assertNumber(extent[j]);
              }
            }
          }
          if (type && extent) {
            features = this.getFeaturesObjectForExtent(extent,
                /** @type {ol.geom.GeometryType} */ (type));
          }
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
        if (ol.expr.evaluateFeature(opt_expr, feature)) {
          features[i] = feature;
        }
      }
    }
  }
  return features;
};


/**
 * Get all features whose bounding box intersects the provided extent.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.geom.GeometryType=} opt_type Optional geometry type.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.layer.FeatureCache.prototype.getFeaturesObjectForExtent = function(extent,
    opt_type) {
  var features;
  if (goog.isDef(opt_type) &&
      goog.object.isEmpty(this.geometryTypeIndex_[opt_type])) {
    features = {};
  } else {
    features = this.rTree_.searchReturningObject(extent, opt_type);
  }
  return features;
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
 * @param {ol.layer.VectorLayerOptions} options Vector layer options.
 */
ol.layer.Vector = function(options) {

  goog.base(this, {
    opacity: options.opacity,
    source: options.source,
    visible: options.visible
  });

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = goog.isDef(options.style) ? options.style : null;

  /**
   * @type {ol.layer.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.layer.FeatureCache();

  /**
   * @type {function(Array.<ol.Feature>):string}
   * @private
   */
  this.transformFeatureInfo_ = goog.isDef(options.transformFeatureInfo) ?
      options.transformFeatureInfo : ol.layer.Vector.uidTransformFeatureInfo;

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
 * @param {ol.expr.Expression=} opt_expr Expression for filtering.
 * @return {Array.<ol.Feature>} Array of features.
 */
ol.layer.Vector.prototype.getFeatures = function(opt_expr) {
  return goog.object.getValues(
      this.featureCache_.getFeaturesObject(opt_expr));
};


/**
 * @param {ol.expr.Expression=} opt_expr Expression for filtering.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.layer.Vector.prototype.getFeaturesObject = function(opt_expr) {
  return this.featureCache_.getFeaturesObject(opt_expr);
};


/**
 * Get all features whose bounding box intersects the provided extent.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.geom.GeometryType=} opt_type Optional geometry type.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.layer.Vector.prototype.getFeaturesObjectForExtent = function(extent,
    opt_type) {
  return this.featureCache_.getFeaturesObjectForExtent(extent, opt_type);
};


/**
 * @return {ol.geom.SharedVertices} Shared line vertices.
 */
ol.layer.Vector.prototype.getLineVertices = function() {
  return this.lineVertices_;
};


/**
 * @return {ol.geom.SharedVertices} Shared point vertices.
 */
ol.layer.Vector.prototype.getPointVertices = function() {
  return this.pointVertices_;
};


/**
 * @return {ol.geom.SharedVertices} Shared polygon vertices.
 */
ol.layer.Vector.prototype.getPolygonVertices = function() {
  return this.polygonVertices_;
};


/**
 * @param {Object.<string, ol.Feature>} features Features.
 * @return {Array.<Array>} symbolizers for features. Each array in this array
 *     contains 3 items: an array of features, the symbolizer literal, and
 *     an array with optional additional data for each feature.
 */
ol.layer.Vector.prototype.groupFeaturesBySymbolizerLiteral =
    function(features) {
  var uniqueLiterals = {},
      featuresBySymbolizer = [],
      style = this.style_,
      i, j, l, feature, literals, numLiterals, literal, uniqueLiteral, key,
      item;
  for (i in features) {
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
        featuresBySymbolizer.push([
          /** @type {Array.<ol.Feature>} */ ([]),
          /** @type {ol.style.SymbolizerLiteral} */ (literal),
          /** @type {Array} */ ([])
        ]);
      }
      item = featuresBySymbolizer[uniqueLiterals[key]];
      item[0].push(feature);
      if (literal instanceof ol.style.TextLiteral) {
        item[2].push(literals[j].text);
      }
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

  var lookup = {};
  lookup[ol.geom.GeometryType.POINT] = this.pointVertices_;
  lookup[ol.geom.GeometryType.LINESTRING] = this.lineVertices_;
  lookup[ol.geom.GeometryType.POLYGON] = this.polygonVertices_;
  lookup[ol.geom.GeometryType.MULTIPOINT] = this.pointVertices_;
  lookup[ol.geom.GeometryType.MULTILINESTRING] = this.lineVertices_;
  lookup[ol.geom.GeometryType.MULTIPOLYGON] = this.polygonVertices_;

  var callback = function(feature, type) {
    return lookup[type];
  };

  var addFeatures = function(features) {
    var sourceProjection = this.getSource().getProjection();
    var transform = ol.proj.getTransform(sourceProjection, projection);

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

    this.addFeatures(features);
  };

  var options = {callback: callback};
  if (goog.isString(data)) {
    if (goog.isFunction(parser.readFeaturesFromStringAsync)) {
      parser.readFeaturesFromStringAsync(data, goog.bind(addFeatures, this),
          options);
    } else {
      goog.asserts.assert(goog.isFunction(parser.readFeaturesFromString),
          'Expected a parser with readFeaturesFromString method.');
      features = parser.readFeaturesFromString(data, options);
      addFeatures.call(this, features);
    }
  } else if (goog.isObject(data)) {
    if (goog.isFunction(parser.readFeaturesFromObjectAsync)) {
      parser.readFeaturesFromObjectAsync(data, goog.bind(addFeatures, this),
          options);
    } else {
      goog.asserts.assert(goog.isFunction(parser.readFeaturesFromObject),
          'Expected a parser with a readFeaturesFromObject method.');
      features = parser.readFeaturesFromObject(data, options);
      addFeatures.call(this, features);
    }
  } else {
    // TODO: parse more data types
    throw new Error('Data type not supported: ' + data);
  }
};


/**
 * @return {function(Array.<ol.Feature>):string} Feature info function.
 */
ol.layer.Vector.prototype.getTransformFeatureInfo = function() {
  return this.transformFeatureInfo_;
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {string} Feature info.
 */
ol.layer.Vector.uidTransformFeatureInfo = function(features) {
  var featureIds = goog.array.map(features,
      function(feature) { return goog.getUid(feature); });
  return featureIds.join(', ');
};
