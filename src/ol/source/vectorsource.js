goog.provide('ol.source.FeatureCache');
goog.provide('ol.source.Vector');
goog.provide('ol.source.VectorEventType');
goog.provide('ol.source.VectorLoadState');

goog.require('goog.asserts');
goog.require('goog.async.nextTick');
goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.FeatureEventType');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Source');
goog.require('ol.structs.RTree');


/**
 * @enum {number}
 */
ol.source.VectorLoadState = {
  IDLE: 0,
  LOADING: 1,
  LOADED: 2,
  ERROR: 3
};



/**
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.VectorOptions=} opt_options Vector source options.
 * @todo stability experimental
 */
ol.source.Vector = function(opt_options) {
  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });

  /**
   * @private
   * @type {ol.parser.Parser}
   */
  this.parser_ = goog.isDef(options.parser) ? options.parser : null;

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = options.url;

  /**
   * @private
   * @type {ol.source.VectorLoadState}
   */
  this.loadState_ = goog.isDef(this.url_) ?
      ol.source.VectorLoadState.IDLE : ol.source.VectorLoadState.LOADED;

  /**
   * @type {ol.source.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.source.FeatureCache();

  // add any user provided features
  if (goog.isDef(options.features)) {
    this.addFeatures(options.features);
  }

};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * Request for new features to be loaded.
 * @param {ol.Extent} extent Desired extent.
 * @param {ol.proj.Projection} projection Desired projection.
 * @return {boolean} New features will be loaded.
 */
ol.source.Vector.prototype.load = function(extent, projection) {
  var requested = false;
  if (this.loadState_ === ol.source.VectorLoadState.IDLE) {
    goog.asserts.assertString(this.url_);
    this.loadState_ = ol.source.VectorLoadState.LOADING;
    goog.net.XhrIo.send(this.url_, goog.bind(function(event) {
      var xhr = event.target;
      if (xhr.isSuccess()) {
        // parsing may be asynchronous, so we don't set load state here
        this.parseFeaturesString_(xhr.getResponseText(), projection);
      } else {
        this.loadState_ = ol.source.VectorLoadState.ERROR;
      }
    }, this));
    requested = true;
  }
  return requested;
};


/**
 * Parse features from a string.
 * @param {string} data Feature data.
 * @param {ol.proj.Projection} projection The target projection.
 * @private
 */
ol.source.Vector.prototype.parseFeaturesString_ = function(data, projection) {
  if (goog.isFunction(this.parser_.readFeaturesFromStringAsync)) {
    this.parser_.readFeaturesFromStringAsync(data, goog.bind(function(result) {
      this.handleReadResult_(result, projection);
    }, this));
  } else {
    goog.asserts.assert(
        goog.isFunction(this.parser_.readFeaturesFromString),
        'Expected parser with a readFeaturesFromString method.');
    this.handleReadResult_(
        this.parser_.readFeaturesFromString(data), projection);
  }
};


/**
 * Handle the read result from a parser.
 * TODO: make parsers accept a target projection (see #1287)
 * @param {ol.parser.ReadFeaturesResult} result Read features result.
 * @param {ol.proj.Projection} projection The desired projection.
 * @private
 */
ol.source.Vector.prototype.handleReadResult_ = function(result, projection) {
  var features = result.features;
  var sourceProjection = this.getProjection();
  if (goog.isNull(sourceProjection)) {
    sourceProjection = result.metadata.projection;
  }
  var transform = ol.proj.getTransform(sourceProjection, projection);
  var extent = ol.extent.createEmpty();
  var geometry = null;
  var feature;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      geometry.transform(transform);
      ol.extent.extend(extent, geometry.getBounds());
    }
    this.loadFeature_(feature);
  }
  this.loadState_ = ol.source.VectorLoadState.LOADED;
  // called in the next tick to normalize load event for sync/async parsing
  goog.async.nextTick(function() {
    this.dispatchEvent(new ol.source.VectorEvent(ol.source.VectorEventType.LOAD,
        features, [extent]));
  }, this);
};


/**
 * Load a feature.
 * @param {ol.Feature} feature Feature to load.
 * @private
 */
ol.source.Vector.prototype.loadFeature_ = function(feature) {
  goog.events.listen(feature, ol.FeatureEventType.CHANGE,
      this.handleFeatureChange_, false, this);
  goog.events.listen(feature, ol.FeatureEventType.INTENTCHANGE,
      this.handleIntentChange_, false, this);
  this.featureCache_.add(feature);
};


/**
 * Add newly created features to the source.
 * @param {Array.<ol.Feature>} features Array of features.
 */
ol.source.Vector.prototype.addFeatures = function(features) {
  var extent = ol.extent.createEmpty(),
      feature, geometry;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    this.loadFeature_(feature);
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      ol.extent.extend(extent, geometry.getBounds());
    }
  }
  this.dispatchEvent(new ol.source.VectorEvent(ol.source.VectorEventType.ADD,
      features, [extent]));
};


/**
 * Returns an array of features that match a filter. This will not fetch data,
 * it only considers features that are loaded already.
 * @param {(function(ol.Feature):boolean)=} opt_filter Filter function.
 * @return {Array.<ol.Feature>} Features that match the filter, or all features
 *     if no filter was provided.
 */
ol.source.Vector.prototype.getFeatures = function(opt_filter) {
  var result;
  var features = this.featureCache_.getFeaturesObject();
  if (goog.isDef(opt_filter)) {
    result = [];
    for (var f in features) {
      if (opt_filter(features[f]) === true) {
        result.push(features[f]);
      }
    }
  } else {
    result = goog.object.getValues(features);
  }
  return result;
};


/**
 * Get all features whose bounding box intersects the provided extent. This
 * method is intended for being called by the renderer.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.proj.Projection} projection Target projection.
 * @param {function(this: T, ol.Feature)} callback Callback called with each
 *     feature.
 * @param {T=} opt_thisArg The object to be used as the value of 'this' for
 *     the callback.
 * @template T
 */
ol.source.Vector.prototype.forEachFeatureInExtent = function(extent,
    projection, callback, opt_thisArg) {
  // TODO: transform if requested project is different than loaded projection
  this.featureCache_.forEach(extent, callback, opt_thisArg);
};


/**
 * Listener for feature change events.
 * @param {ol.FeatureEvent} evt The feature change event.
 * @private
 */
ol.source.Vector.prototype.handleFeatureChange_ = function(evt) {
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
  this.dispatchEvent(new ol.source.VectorEvent(ol.source.VectorEventType.CHANGE,
      [feature], extents));
};


/**
 * Listener for render intent change events of features.
 * @param {ol.FeatureEvent} evt The feature intent change event.
 * @private
 */
ol.source.Vector.prototype.handleIntentChange_ = function(evt) {
  goog.asserts.assertInstanceof(evt.target, ol.Feature);
  var feature = /** @type {ol.Feature} */ (evt.target);
  var geometry = feature.getGeometry();
  if (!goog.isNull(geometry)) {
    this.dispatchEvent(new ol.source.VectorEvent(
        ol.source.VectorEventType.INTENTCHANGE, [feature],
        [geometry.getBounds()]));
  }
};


/**
 * Remove features from the layer.
 * @param {Array.<ol.Feature>} features Features to remove.
 */
ol.source.Vector.prototype.removeFeatures = function(features) {
  var extent = ol.extent.createEmpty(),
      feature, geometry;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    this.featureCache_.remove(feature);
    geometry = feature.getGeometry();
    if (!goog.isNull(geometry)) {
      ol.extent.extend(extent, geometry.getBounds());
    }
    goog.events.unlisten(feature, ol.FeatureEventType.CHANGE,
        this.handleFeatureChange_, false, this);
    goog.events.unlisten(feature, ol.FeatureEventType.INTENTCHANGE,
        this.handleIntentChange_, false, this);
  }
  this.dispatchEvent(new ol.source.VectorEvent(ol.source.VectorEventType.REMOVE,
      features, [extent]));
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {Array.<ol.Feature>} features Features associated with the event.
 * @param {Array.<ol.Extent>} extents Any extents associated with the event.
 */
ol.source.VectorEvent = function(type, features, extents) {

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
goog.inherits(ol.source.VectorEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.source.VectorEventType = {
  LOAD: 'featureload',
  ADD: 'featureadd',
  CHANGE: 'featurechange',
  INTENTCHANGE: 'featureintentchange',
  REMOVE: 'featureremove'
};



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

  // index by bounding box
  if (!goog.isNull(geometry)) {
    this.rTree_.insert(geometry.getBounds(), feature);
  }
};


/**
 * @return {Object.<string, ol.Feature>} Object of features, keyed by id.
 */
ol.source.FeatureCache.prototype.getFeaturesObject = function() {
  return this.idLookup_;
};


/**
 * Operate on each feature whose bounding box intersects the provided extent.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {function(this: T, ol.Feature)} callback Callback called with each
 *     feature.
 * @param {T=} opt_thisArg The object to be used as the value of 'this' for
 *     the callback.
 * @template T
 */
ol.source.FeatureCache.prototype.forEach =
    function(extent, callback, opt_thisArg) {
  this.rTree_.forEach(
      extent, /** @type {function(Object)} */ (callback), opt_thisArg);
};


/**
 * Remove a feature from the cache.
 * @param {ol.Feature} feature Feature.
 * @param {ol.Extent=} opt_extent Optional extent (used when the current feature
 *     extent is different than the one in the index).
 */
ol.source.FeatureCache.prototype.remove = function(feature, opt_extent) {
  var id = goog.getUid(feature).toString(),
      geometry = feature.getGeometry();

  delete this.idLookup_[id];
  // index by bounding box
  if (!goog.isNull(geometry)) {
    var extent = goog.isDef(opt_extent) ? opt_extent : geometry.getBounds();
    this.rTree_.remove(extent, feature);
  }
};
