goog.provide('ol.source.FeatureCache');
goog.provide('ol.source.Vector');
goog.provide('ol.source.VectorEventType');

goog.require('goog.asserts');
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

  /**
   * @private
   * @type {Object|string}
   */
  this.data_ = goog.isDef(options.data) ? options.data : null;

  /**
   * @private
   * @type {ol.source.VectorLoadState}
   */
  this.loadState_ = ol.source.VectorLoadState.IDLE;

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
   * @type {ol.source.FeatureCache}
   * @private
   */
  this.featureCache_ = new ol.source.FeatureCache();

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection
  });
};
goog.inherits(ol.source.Vector, ol.source.Source);


/**
 * @param {Array.<ol.Feature>} features Array of features.
 */
ol.source.Vector.prototype.addFeatures = function(features) {
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
    goog.events.listen(feature, ol.FeatureEventType.INTENTCHANGE,
        this.handleIntentChange_, false, this);
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
 * method is intended for being called by the renderer. When null is returned,
 * the renderer should not waste time rendering, and `opt_callback` is
 * usually a function that requests a renderFrame, which will be called as soon
 * as the data for `extent` is available.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @param {ol.proj.Projection} projection Target projection.
 * @param {function()=} opt_callback Callback to call when data is parsed.
 * @return {Object.<string, ol.Feature>} Features or null if source is loading
 *     data for `extent`.
 */
ol.source.Vector.prototype.getFeaturesObjectForExtent = function(extent,
    projection, opt_callback) {
  var state = this.prepareFeatures_(extent, projection, opt_callback);
  var lookup = null;
  if (state !== ol.source.VectorLoadState.LOADING) {
    lookup = this.featureCache_.getFeaturesObjectForExtent(extent);
  }
  return lookup;
};


/**
 * @param {Object|Element|Document|string} data Feature data.
 * @param {ol.proj.Projection} projection This sucks.  The layer should be a
 *     view in one projection.
 * @private
 */
ol.source.Vector.prototype.parseFeatures_ = function(data, projection) {

  var addFeatures = function(data) {
    var features = data.features;
    var sourceProjection = this.getProjection();
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
  var parser = this.parser_;
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
 * @param {ol.Extent} extent Extent that needs to be fetched.
 * @param {ol.proj.Projection} projection Projection of the view.
 * @param {function()=} opt_callback Callback which is called when features are
 *     parsed after loading.
 * @return {ol.source.VectorLoadState} The current load state.
 * @private
 */
ol.source.Vector.prototype.prepareFeatures_ = function(extent, projection,
    opt_callback) {
  // TODO: Implement strategies. BBOX aware strategies will need the extent.
  if (goog.isDef(this.url_) &&
      this.loadState_ == ol.source.VectorLoadState.IDLE) {
    this.loadState_ = ol.source.VectorLoadState.LOADING;
    goog.net.XhrIo.send(this.url_, goog.bind(function(event) {
      var xhr = event.target;
      if (xhr.isSuccess()) {
        // TODO: Get source projection from data if supported by parser.
        this.parseFeatures_(xhr.getResponseText(), projection);
        this.loadState_ = ol.source.VectorLoadState.LOADED;
        if (goog.isDef(opt_callback)) {
          opt_callback();
        }
      } else {
        // TODO: Error handling.
        this.loadState_ = ol.source.VectorLoadState.ERROR;
      }
    }, this));
  } else if (!goog.isNull(this.data_)) {
    this.parseFeatures_(this.data_, projection);
    this.data_ = null;
    this.loadState_ = ol.source.VectorLoadState.LOADED;
  }
  return this.loadState_;
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
 * Get all features whose bounding box intersects the provided extent.
 *
 * @param {ol.Extent} extent Bounding extent.
 * @return {Object.<string, ol.Feature>} Features.
 */
ol.source.FeatureCache.prototype.getFeaturesObjectForExtent = function(extent) {
  return this.rTree_.searchReturningObject(extent);
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
