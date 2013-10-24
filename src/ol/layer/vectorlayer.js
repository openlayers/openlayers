goog.provide('ol.layer.Vector');
goog.provide('ol.layer.VectorEventType');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.FeatureEventType');
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
 * @param {ol.Extent=} opt_extent Optional extent (used when the current feature
 *     extent is different than the one in the index).
 */
ol.layer.FeatureCache.prototype.remove = function(feature, opt_extent) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  delete this.idLookup_[id];
  // index by bounding box
  if (!goog.isNull(geometry)) {
    var extent = goog.isDef(opt_extent) ? opt_extent : geometry.getBounds();
    this.rTree_.remove(extent, feature);
  }
};



/**
 * @constructor
 * @extends {ol.layer.Layer}
 * @param {ol.layer.VectorLayerOptions} options Vector layer options.
 * @todo stability experimental
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
    goog.events.listen(feature, ol.FeatureEventType.CHANGE,
        this.handleFeatureChange_, false, this);
  }
  this.dispatchEvent(new ol.layer.VectorEvent(ol.layer.VectorEventType.ADD,
      features, [extent]));
};


/**
 * Listener for feature change events.
 * @param {ol.FeatureEvent} evt The feature change event.
 * @private
 */
ol.layer.Vector.prototype.handleFeatureChange_ = function(evt) {
  goog.asserts.assertInstanceof(evt.target, ol.Feature);
  var feature = /** @type {ol.Feature} */ (evt.target);
  var extents = [];
  if (!goog.isNull(evt.oldExtent)) {
    extents.push(evt.oldExtent);
  }
  var geometry = feature.getGeometry();
  if (!goog.isNull(geometry)) {
    this.featureCache_.remove(feature, evt.oldExtent);
    this.featureCache_.add(feature);
    extents.push(geometry.getBounds());
  }
  this.dispatchEvent(new ol.layer.VectorEvent(ol.layer.VectorEventType.CHANGE,
      [feature], extents));
};


/**
 * Remove all features from the layer.
 */
ol.layer.Vector.prototype.clear = function() {
  this.featureCache_.clear();
  this.dispatchEvent(
      new ol.layer.VectorEvent(ol.layer.VectorEventType.REMOVE, [], []));
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
  featuresBySymbolizer.sort(this.sortByZIndex_);
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
  this.dispatchEvent(new ol.layer.VectorEvent(ol.layer.VectorEventType.REMOVE,
      features, [extent]));
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
  this.dispatchEvent(new ol.layer.VectorEvent(
      ol.layer.VectorEventType.INTENTCHANGE, features, [extent]));
};


/**
 * @param {boolean} temp Whether this layer is temporary.
 */
ol.layer.Vector.prototype.setTemporary = function(temp) {
  this.temp_ = temp;
};


/**
 * Sort function for `groupFeaturesBySymbolizerLiteral`.
 * @private
 * @param {Array} a 1st item for the sort comparison.
 * @param {Array} b 2nd item for the sort comparison.
 * @return {number} Comparison result.
 */
ol.layer.Vector.prototype.sortByZIndex_ = function(a, b) {
  return a[1].zIndex - b[1].zIndex;
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



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {Array.<ol.Feature>} features Features associated with the event.
 * @param {Array.<ol.Extent>} extents Any extents associated with the event.
 */
ol.layer.VectorEvent = function(type, features, extents) {

  goog.base(this, type);

  /**
   * @type {Array.<ol.Feature>}
   */
  this.features = features;

  /**
   * @type {Array.<ol.Extent>}
   */
  this.extents = extents;

};
goog.inherits(ol.layer.VectorEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.layer.VectorEventType = {
  ADD: 'featureadd',
  CHANGE: 'featurechange',
  REMOVE: 'featureremove',
  INTENTCHANGE: 'intentchange'
};
