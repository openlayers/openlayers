goog.provide('ol.layer.Vector');
goog.provide('ol.layer.VectorLayerEventType');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.layer.Layer');
goog.require('ol.proj');
goog.require('ol.source.Vector');
goog.require('ol.structs.RTree');
goog.require('ol.style');
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

  // index by bounding box
  if (!goog.isNull(geometry)) {
    this.rTree_.insert(geometry.getBounds(), feature);
  }
};


/**
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 */
ol.layer.FeatureCache.prototype.getFeaturesObject = function() {
  return this.idLookup_;
};


/**
 * Get all features whose bounding box intersects the provided extent.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.layer.FeatureCache.prototype.getFeaturesObjectForExtent = function(extent) {
  return this.rTree_.searchReturningObject(extent);
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
 * @param {string} uid Feature uid.
 * @return {ol.Feature|undefined} The feature with the provided uid if it is in
 *     the cache, otherwise undefined.
 */
ol.layer.FeatureCache.prototype.getFeatureWithUid = function(uid) {
  return this.idLookup_[uid];
};


/**
 * Remove a feature from the cache.
 * @param {ol.Feature} feature Feature.
 */
ol.layer.FeatureCache.prototype.remove = function(feature) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  delete this.idLookup_[id];

  // index by bounding box
  if (!goog.isNull(geometry)) {
    this.rTree_.remove(geometry.getBounds(), feature);
  }
};


/**
 * @enum {string}
 */
ol.layer.VectorLayerEventType = {
  ADD: 'add',
  CHANGE: goog.events.EventType.CHANGE,
  REMOVE: 'remove',
  INTENTCHANGE: 'intentchange'
};


/**
 * @typedef {{extent: (ol.Extent|undefined),
 *            features: (Array.<ol.Feature>|undefined),
 *            type: ol.layer.VectorLayerEventType}}
 */
ol.layer.VectorLayerEventObject;



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.VectorLayerOptions} options Vector layer options.
 */
ol.layer.Vector = function(options) {

  goog.base(this, /** @type {ol.layer.LayerOptions} */ (options));

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
   * True if this is a temporary layer.
   * @type {boolean}
   * @private
   */
  this.temp_ = false;

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
    type: ol.layer.VectorLayerEventType.ADD
  }));
};


/**
 * Remove all features from the layer.
 */
ol.layer.Vector.prototype.clear = function() {
  this.featureCache_.clear();
  this.dispatchEvent(/** @type {ol.layer.VectorLayerEventObject} */ ({
    type: ol.layer.VectorLayerEventType.CHANGE
  }));
};


/**
 * @return {boolean} Whether this layer is temporary.
 */
ol.layer.Vector.prototype.getTemporary = function() {
  return this.temp_;
};


/**
 * @return {ol.source.Vector} Source.
 */
ol.layer.Vector.prototype.getVectorSource = function() {
  return /** @type {ol.source.Vector} */ (this.getSource());
};


/**
 * @return {ol.style.Style} This layer's style.
 */
ol.layer.Vector.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get all features whose bounding box intersects the provided extent. This
 * method is intended for being called by the renderer. When null is returned,
 * the renderer should not waste time rendering, and `opt_callback` is
 * usually a function that requests a renderFrame, which will be called as soon
 * as the data for `extent` is available.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.proj.Projection} projection Target projection.
 * @param {Function=} opt_callback Callback to call when data is parsed.
 * @return {Object.<string, ol.Feature>} Features or null if source is loading
 *     data for `extent`.
 */
ol.layer.Vector.prototype.getFeaturesObjectForExtent = function(extent,
    projection, opt_callback) {
  var source = this.getSource();
  return source.prepareFeatures(this, extent, projection, opt_callback) ==
      ol.source.VectorLoadState.LOADING ?
          null :
          this.featureCache_.getFeaturesObjectForExtent(extent);
};


/**
 * @param {Object.<string, ol.Feature>} features Features.
 * @param {number} resolution Map resolution.
 * @return {Array.<Array>} symbolizers for features. Each array in this array
 *     contains 3 items: an array of features, the symbolizer literal, and
 *     an array with optional additional data for each feature.
 */
ol.layer.Vector.prototype.groupFeaturesBySymbolizerLiteral =
    function(features, resolution) {
  var uniqueLiterals = {},
      featuresBySymbolizer = [],
      style = this.style_,
      i, j, l, feature, symbolizers, literals, numLiterals, literal,
      uniqueLiteral, key, item;
  for (i in features) {
    feature = features[i];
    // feature level symbolizers take precedence
    symbolizers = feature.getSymbolizers();
    if (!goog.isNull(symbolizers)) {
      literals = ol.style.Style.createLiterals(symbolizers, feature);
    } else {
      // layer style second
      if (goog.isNull(style)) {
        style = ol.style.getDefault();
      }
      literals = style.createLiterals(feature, resolution);
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
          /** @type {ol.style.Literal} */ (literal),
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
 * @param {string|number} uid Feature uid.
 * @return {ol.Feature|undefined} The feature with the provided uid if it is on
 *     the layer, otherwise undefined.
 */
ol.layer.Vector.prototype.getFeatureWithUid = function(uid) {
  return this.featureCache_.getFeatureWithUid(/** @type {string} */ (uid));
};


/**
 * @param {Object|Element|Document|string} data Feature data.
 * @param {ol.parser.Parser} parser Feature parser.
 * @param {ol.proj.Projection} projection This sucks.  The layer should be a
 *     view in one projection.
 */
ol.layer.Vector.prototype.parseFeatures = function(data, parser, projection) {

  var addFeatures = function(data) {
    var features = data.features;
    var sourceProjection = this.getSource().getProjection();
    if (goog.isNull(sourceProjection)) {
      sourceProjection = data.metadata.projection;
    }
    var transform = ol.proj.getTransform(sourceProjection, projection);
    var geometry = null;
    for (var i = 0, ii = features.length; i < ii; ++i) {
      geometry = features[i].getGeometry();
      if (!goog.isNull(geometry)) {
        geometry.transform(transform);
      }
    }
    this.addFeatures(features);
  };

  var result;
  if (goog.isString(data)) {
    if (goog.isFunction(parser.readFeaturesFromStringAsync)) {
      parser.readFeaturesFromStringAsync(data, goog.bind(addFeatures, this));
    } else {
      goog.asserts.assert(
          goog.isFunction(parser.readFeaturesFromString),
          'Expected parser with a readFeaturesFromString method.');
      result = parser.readFeaturesFromString(data);
      addFeatures.call(this, result);
    }
  } else if (goog.isObject(data)) {
    if (goog.isFunction(parser.readFeaturesFromObjectAsync)) {
      parser.readFeaturesFromObjectAsync(data, goog.bind(addFeatures, this));
    } else {
      goog.asserts.assert(
          goog.isFunction(parser.readFeaturesFromObject),
          'Expected parser with a readFeaturesFromObject method.');
      result = parser.readFeaturesFromObject(data);
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
    type: ol.layer.VectorLayerEventType.REMOVE
  }));
};


/**
 * Changes the renderIntent for an array of features.
 * @param {string} renderIntent Render intent.
 * @param {Array.<ol.Feature>=} opt_features Features to change the renderIntent
 *     for. If not provided, all features will be changed.
 */
ol.layer.Vector.prototype.setRenderIntent =
    function(renderIntent, opt_features) {
  var features = goog.isDef(opt_features) ? opt_features :
      goog.object.getValues(this.featureCache_.getFeaturesObject());
  var extent = ol.extent.createEmpty(),
      feature, geometry;
  for (var i = features.length - 1; i >= 0; --i) {
    feature = features[i];
    feature.renderIntent = renderIntent;
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      ol.extent.extend(extent, geometry.getBounds());
    }
  }
  this.dispatchEvent(/** @type {ol.layer.VectorLayerEventObject} */ ({
    extent: extent,
    features: features,
    type: ol.layer.VectorLayerEventType.INTENTCHANGE
  }));
};


/**
 * @param {boolean} temp Whether this layer is temporary.
 */
ol.layer.Vector.prototype.setTemporary = function(temp) {
  this.temp_ = temp;
};


/**
 * @param {Array.<ol.Feature>} features Features.
 * @return {string} Feature info.
 */
ol.layer.Vector.uidTransformFeatureInfo = function(features) {
  var uids = goog.array.map(features,
      function(feature) { return goog.getUid(feature); });
  return uids.join(', ');
};
