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
goog.require('ol.expr.functions');
goog.require('ol.extent');
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
    if (name === ol.expr.functions.GEOMETRY_TYPE) {
      var args = /** @type {ol.expr.Call} */ (opt_expr).getArgs();
      goog.asserts.assert(args.length === 1);
      goog.asserts.assert(args[0] instanceof ol.expr.Literal);
      var type = /** @type {ol.expr.Literal } */ (args[0]).evaluate();
      goog.asserts.assertString(type);
      features = this.geometryTypeIndex_[type];
    } else if (name === ol.expr.functions.EXTENT) {
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
            if (name === ol.expr.functions.GEOMETRY_TYPE) {
              args = /** @type {ol.expr.Call} */ (expr).getArgs();
              goog.asserts.assert(args.length === 1);
              goog.asserts.assert(args[0] instanceof ol.expr.Literal);
              type = /** @type {ol.expr.Literal } */ (args[0]).evaluate();
              goog.asserts.assertString(type);
            } else if (name === ol.expr.functions.EXTENT) {
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
 * Remove a feature from the cache.
 * @param {ol.Feature} feature Feature.
 */
ol.layer.FeatureCache.prototype.remove = function(feature) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  delete this.idLookup_[id];

  // index by geometry type and bounding box
  if (!goog.isNull(geometry)) {
    var geometryType = geometry.getType();
    delete this.geometryTypeIndex_[geometryType][id];
    this.rTree_.remove(geometry.getBounds(), feature);
  }
};


/**
 * TODO: Create a VectorLayerEvent with ADD and REMOVE event types
 * @typedef {{extent: (ol.Extent|undefined),
 *            features: (Array.<ol.Feature>|undefined),
 *            type: goog.events.EventType}}
 */
ol.layer.VectorLayerEventObject;



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
  var extent = ol.extent.createEmpty(),
      feature, geometry;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    this.featureCache_.add(feature);
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      ol.extent.extend(extent, geometry.getBounds());
    }
  }
  this.dispatchEvent(/** @type {ol.layer.VectorLayerEventObject} */ ({
    extent: extent,
    features: features,
    type: goog.events.EventType.CHANGE
  }));
};


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * Get all features whose bounding box intersects the provided extent. This
 * method is intended for being called by the renderer. When null is returned,
 * the renderer should not waste time rendering, and `opt_callback` is
 * usually a function that requests a renderFrame, which will be called as soon
 * as the data for `extent` is available.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.Projection} projection Target projection.
 * @param {ol.geom.GeometryType=} opt_type Optional geometry type.
 * @param {Function=} opt_callback Callback to call when data is parsed.
 * @return {Object.<string, ol.Feature>} Features or null if source is loading
 *     data for `extent`.
 */
ol.layer.Vector.prototype.getFeaturesObjectForExtent = function(extent,
    projection, opt_type, opt_callback) {
  var source = this.getSource();
  return source.prepareFeatures(this, extent, projection, opt_callback) ==
      ol.source.VectorLoadState.LOADING ?
          null :
          this.featureCache_.getFeaturesObjectForExtent(extent, opt_type);
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

  var addFeatures = function(data) {
    var features = data.features;
    var sourceProjection = this.getSource().getProjection();
    if (goog.isNull(sourceProjection)) {
      sourceProjection = data.metadata.projection;
    }
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

  var options = {callback: callback}, result;
  if (goog.isString(data)) {
    if (goog.isFunction(parser.readFeaturesFromStringAsync)) {
      parser.readFeaturesFromStringAsync(data, goog.bind(addFeatures, this),
          options);
    } else {
      goog.asserts.assert(
          goog.isFunction(parser.readFeaturesFromString),
          'Expected parser with a readFeaturesFromString method.');
      result = parser.readFeaturesFromString(data, options);
      addFeatures.call(this, result);
    }
  } else if (goog.isObject(data)) {
    if (goog.isFunction(parser.readFeaturesFromObjectAsync)) {
      parser.readFeaturesFromObjectAsync(data, goog.bind(addFeatures, this),
          options);
    } else {
      goog.asserts.assert(
          goog.isFunction(parser.readFeaturesFromObject),
          'Expected parser with a readFeaturesFromObject method.');
      result = parser.readFeaturesFromObject(data, options);
      addFeatures.call(this, result);
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
 * Remove features from the layer.
 * @param {Array.<ol.Feature>} features Features to remove.
 */
ol.layer.Vector.prototype.removeFeatures = function(features) {
  var extent = ol.extent.createEmpty(),
      feature, geometry;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    this.featureCache_.remove(feature);
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      ol.extent.extend(extent, geometry.getBounds());
    }
  }
  this.dispatchEvent(/** @type {ol.layer.VectorLayerEventObject} */ ({
    extent: extent,
    features: features,
    type: goog.events.EventType.CHANGE
  }));
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
