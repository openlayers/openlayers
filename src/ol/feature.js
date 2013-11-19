goog.provide('ol.Feature');
goog.provide('ol.FeatureEvent');
goog.provide('ol.FeatureEventType');

goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('ol.Object');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryEvent');
goog.require('ol.layer.VectorLayerRenderIntent');



/**
 * Create a new feature. A feature is the base entity for vectors and has
 * attributes, including normally a geometry attribute.
 *
 * Example:
 *
 *     var feature = new ol.Feature({'foo': 'bar'});
 *     feature.setGeometry(new ol.geom.Point([100, 500]));
 *
 * @constructor
 * @extends {ol.Object}
 * @param {Object.<string, *>=} opt_values Attributes.
 * @todo stability experimental
 */
ol.Feature = function(opt_values) {

  goog.base(this, opt_values);

  /**
   * @type {string|undefined}
   * @private
   */
  this.featureId_;

  /**
   * @type {string|undefined}
   * @private
   */
  this.geometryName_;

  /**
   * Original of this feature when it was modified.
   * @type {ol.Feature}
   * @private
   */
  this.original_ = null;

  /**
   * The render intent for this feature.
   * @type {ol.layer.VectorLayerRenderIntent|string}
   * @private
   */
  this.renderIntent_ = ol.layer.VectorLayerRenderIntent.DEFAULT;

  /**
   * @type {Array.<ol.style.Symbolizer>}
   * @private
   */
  this.symbolizers_ = null;

};
goog.inherits(ol.Feature, ol.Object);


/**
 * Gets a copy of the attributes of this feature.
 * @param {boolean=} opt_nonGeometry Don't include any geometry attributes
 *     (by default geometry attributes are returned).
 * @return {Object.<string, *>} Attributes object.
 * @todo stability experimental
 */
ol.Feature.prototype.getAttributes = function(opt_nonGeometry) {
  var keys = this.getKeys(),
      len = keys.length,
      attributes = {},
      i, key;
  for (i = 0; i < len; ++ i) {
    key = keys[i];
    var value = this.get(key);
    if (!goog.isDef(opt_nonGeometry) || opt_nonGeometry === false ||
        (opt_nonGeometry === true && !(value instanceof ol.geom.Geometry))) {
      attributes[key] = value;
    }
  }
  return attributes;
};


/**
 * Returns the feature's commonly used identifier. This identifier is usually
 * the unique id in the source store.
 *
 * @return {string|undefined} The feature's identifier.
 * @todo stability experimental
 */
ol.Feature.prototype.getId = function() {
  return this.featureId_;
};


/**
 * Get the geometry associated with this feature.
 * @return {ol.geom.Geometry} The geometry (or null if none).
 * @todo stability experimental
 */
ol.Feature.prototype.getGeometry = function() {
  return goog.isDef(this.geometryName_) ?
      /** @type {ol.geom.Geometry} */ (this.get(this.geometryName_)) :
      null;
};


/**
 * Get the original of this feature when it was modified.
 * @return {ol.Feature} Original.
 */
ol.Feature.prototype.getOriginal = function() {
  return this.original_;
};


/**
 * Get any symbolizers set directly on the feature.
 * @return {Array.<ol.style.Symbolizer>} Symbolizers (or null if none).
 */
ol.Feature.prototype.getSymbolizers = function() {
  return this.symbolizers_;
};


/**
 * Listener for geometry change events.
 * @param {ol.geom.GeometryEvent} evt Geometry event.
 * @private
 */
ol.Feature.prototype.handleGeometryChange_ = function(evt) {
  this.dispatchEvent(new ol.FeatureEvent(
      ol.FeatureEventType.CHANGE, this, evt.oldExtent));
};


/**
 * @inheritDoc
 * @param {string} key Key.
 * @param {*} value Value.
 * @todo stability experimental
 */
ol.Feature.prototype.set = function(key, value) {
  var geometry = this.getGeometry();
  var oldExtent = null;
  if (goog.isDefAndNotNull(geometry)) {
    oldExtent = geometry.getBounds();
    if (key === this.geometryName_) {
      goog.events.unlisten(geometry, goog.events.EventType.CHANGE,
          this.handleGeometryChange_, false, this);
    }
  }
  if (value instanceof ol.geom.Geometry) {
    if (!goog.isDef(this.geometryName_)) {
      this.geometryName_ = key;
    }
    if (key === this.geometryName_) {
      goog.events.listen(value, goog.events.EventType.CHANGE,
          this.handleGeometryChange_, false, this);
    }
  }
  goog.base(this, 'set', key, value);
  this.dispatchEvent(new ol.FeatureEvent(
      ol.FeatureEventType.CHANGE, this, oldExtent));
};


/**
 * Set the feature's commonly used identifier. This identifier is usually the
 * unique id in the source store.
 *
 * @param {string|undefined} featureId The feature's identifier.
 */
ol.Feature.prototype.setId = function(featureId) {
  this.featureId_ = featureId;
};


/**
 * Set the geometry to be associated with this feature after its creation.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @todo stability experimental
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  if (!goog.isDef(this.geometryName_)) {
    this.geometryName_ = ol.Feature.DEFAULT_GEOMETRY;
  }
  this.set(this.geometryName_, geometry);
};


/**
 * Set the original of this feature when it was modified.
 * @param {ol.Feature} original Original.
 */
ol.Feature.prototype.setOriginal = function(original) {
  this.original_ = original;
};


/**
 * Gets the renderIntent for this feature.
 * @return {string} Render intent.
 */
ol.Feature.prototype.getRenderIntent = function() {
  return this.renderIntent_;
};


/**
 * Changes the renderIntent for this feature.
 * @param {string} renderIntent Render intent.
 */
ol.Feature.prototype.setRenderIntent = function(renderIntent) {
  this.renderIntent_ = renderIntent;
  var geometry = this.getGeometry();
  if (!goog.isNull(geometry)) {
    this.dispatchEvent(new ol.FeatureEvent(
        ol.FeatureEventType.INTENTCHANGE, this, geometry.getBounds()));
  }
};


/**
 * Set the symbolizers to be used for this feature.
 * @param {Array.<ol.style.Symbolizer>} symbolizers Symbolizers for this
 *     feature. If set, these take precedence over layer style.
 */
ol.Feature.prototype.setSymbolizers = function(symbolizers) {
  this.symbolizers_ = symbolizers;
};


/**
 * @const
 * @type {string}
 */
ol.Feature.DEFAULT_GEOMETRY = 'geometry';


/**
 * @enum {string}
 */
ol.FeatureEventType = {
  CHANGE: 'featurechange',
  INTENTCHANGE: 'featureintentchange'
};



/**
 * Constructor for feature events.
 * @constructor
 * @extends {goog.events.Event}
 * @param {string} type Event type.
 * @param {ol.Feature} target The target feature.
 * @param {ol.Extent} oldExtent The previous geometry extent.
 */
ol.FeatureEvent = function(type, target, oldExtent) {
  goog.base(this, type, target);

  this.oldExtent = oldExtent;
};
goog.inherits(ol.FeatureEvent, goog.events.Event);
