goog.provide('ol.Feature');
goog.provide('ol.feature');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('ol.Object');
goog.require('ol.geom.Geometry');
goog.require('ol.style.Style');



/**
 * @classdesc
 * A vector object for geographic features with a geometry and other
 * attribute properties, similar to the features in vector file formats like
 * GeoJSON.
 *
 * Features can be styled individually with `setStyle`; otherwise they use the
 * style of their vector layer or feature overlay.
 *
 * Note that attribute properties are set as {@link ol.Object} properties on
 * the feature object, so they are observable, and have get/set accessors.
 *
 * Typically, a feature has a single geometry property. You can set the
 * geometry using the `setGeometry` method and get it with `getGeometry`.
 * It is possible to store more than one geometry on a feature using attribute
 * properties. By default, the geometry used for rendering is identified by
 * the property name `geometry`. If you want to use another geometry property
 * for rendering, use the `setGeometryName` method to change the attribute
 * property associated with the geometry for the feature.  For example:
 *
 * ```js
 * var feature = new ol.Feature({
 *   geometry: new ol.geom.Polygon(polyCoords),
 *   labelPoint: new ol.geom.Point(labelCoords),
 *   name: 'My Polygon'
 * });
 *
 * // get the polygon geometry
 * var poly = feature.getGeometry();
 *
 * // Render the feature as a point using the coordinates from labelPoint
 * feature.setGeometryName('labelPoint');
 *
 * // get the point geometry
 * var point = feature.getGeometry();
 * ```
 *
 * @constructor
 * @extends {ol.Object}
 * @fires change Triggered when the geometry or style of the feature changes.
 * @param {ol.geom.Geometry|Object.<string, *>=} opt_geometryOrProperties
 *     You may pass a Geometry object directly, or an object literal
 *     containing properties.  If you pass an object literal, you may
 *     include a Geometry associated with a `geometry` key.
 * @api stable
 */
ol.Feature = function(opt_geometryOrProperties) {

  goog.base(this);

  /**
   * @private
   * @type {number|string|undefined}
   */
  this.id_ = undefined;

  /**
   * @type {string}
   * @private
   */
  this.geometryName_ = 'geometry';

  /**
   * User provided style.
   * @private
   * @type {ol.style.Style|Array.<ol.style.Style>|
   *     ol.feature.FeatureStyleFunction}
   */
  this.style_ = null;

  /**
   * @private
   * @type {ol.feature.FeatureStyleFunction|undefined}
   */
  this.styleFunction_ = undefined;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.geometryChangeKey_ = null;

  goog.events.listen(
      this, ol.Object.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, false, this);

  if (goog.isDef(opt_geometryOrProperties)) {
    if (opt_geometryOrProperties instanceof ol.geom.Geometry ||
        goog.isNull(opt_geometryOrProperties)) {
      var geometry = /** @type {ol.geom.Geometry} */ (opt_geometryOrProperties);
      this.setGeometry(geometry);
    } else {
      goog.asserts.assert(goog.isObject(opt_geometryOrProperties));
      var properties = /** @type {Object.<string, *>} */
          (opt_geometryOrProperties);
      this.setProperties(properties);
    }
  }
};
goog.inherits(ol.Feature, ol.Object);


/**
 * Clone this feature. If the original feature has a geometry it
 * is also cloned. The feature id is not set in the clone.
 * @return {ol.Feature} The clone.
 * @api stable
 */
ol.Feature.prototype.clone = function() {
  var clone = new ol.Feature(this.getProperties());
  clone.setGeometryName(this.getGeometryName());
  var geometry = this.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    clone.setGeometry(geometry.clone());
  }
  var style = this.getStyle();
  if (!goog.isNull(style)) {
    clone.setStyle(style);
  }
  return clone;
};


/**
 * @return {ol.geom.Geometry|undefined} Returns the Geometry associated
 *     with this feature using the current geometry name property.  By
 *     default, this is `geometry` but it may be changed by calling
 *     `setGeometryName`.
 * @api stable
 * @observable
 */
ol.Feature.prototype.getGeometry = function() {
  return /** @type {ol.geom.Geometry|undefined} */ (
      this.get(this.geometryName_));
};
goog.exportProperty(
    ol.Feature.prototype,
    'getGeometry',
    ol.Feature.prototype.getGeometry);


/**
 * @return {number|string|undefined} Id.
 * @api stable
 */
ol.Feature.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {string} Get the property name associated with the geometry for
 *     this feature.  By default, this is `geometry` but it may be changed by
 *     calling `setGeometryName`.
 * @api stable
 */
ol.Feature.prototype.getGeometryName = function() {
  return this.geometryName_;
};


/**
 * @return {ol.style.Style|Array.<ol.style.Style>|
 *     ol.feature.FeatureStyleFunction} Return the style as set by setStyle in
 *     the same format that it was provided in. If setStyle has not been run,
 *     return `undefined`.
 * @api stable
 */
ol.Feature.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @return {ol.feature.FeatureStyleFunction|undefined} Return a function
 * representing the current style of this feature.
 * @api stable
 */
ol.Feature.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @private
 */
ol.Feature.prototype.handleGeometryChange_ = function() {
  this.dispatchChangeEvent();
};


/**
 * @private
 */
ol.Feature.prototype.handleGeometryChanged_ = function() {
  if (!goog.isNull(this.geometryChangeKey_)) {
    goog.events.unlistenByKey(this.geometryChangeKey_);
    this.geometryChangeKey_ = null;
  }
  var geometry = this.getGeometry();
  if (goog.isDefAndNotNull(geometry)) {
    this.geometryChangeKey_ = goog.events.listen(geometry,
        goog.events.EventType.CHANGE, this.handleGeometryChange_, false, this);
    this.dispatchChangeEvent();
  }
};


/**
 * @param {ol.geom.Geometry|undefined} geometry Set the geometry for this
 * feature. This will update the property associated with the current
 * geometry property name.  By default, this is `geometry` but it can be
 * changed by calling `setGeometryName`.
 * @api stable
 * @observable
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.set(this.geometryName_, geometry);
};
goog.exportProperty(
    ol.Feature.prototype,
    'setGeometry',
    ol.Feature.prototype.setGeometry);


/**
 * @param {ol.style.Style|Array.<ol.style.Style>|
 *     ol.feature.FeatureStyleFunction} style Set the style for this feature.
 * @api stable
 */
ol.Feature.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = ol.feature.createFeatureStyleFunction(style);
  this.dispatchChangeEvent();
};


/**
 * @param {number|string|undefined} id Set a unique id for this feature.
 * The id may be used to retrieve a feature from a vector source with the
 * {@link ol.source.Vector#getFeatureById} method.
 * @api stable
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;
  this.dispatchChangeEvent();
};


/**
 * @param {string} name Set the property name from which this feature's
 *     geometry will be fetched when calling `getGeometry`.
 * @api stable
 */
ol.Feature.prototype.setGeometryName = function(name) {
  goog.events.unlisten(
      this, ol.Object.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, false, this);
  this.geometryName_ = name;
  goog.events.listen(
      this, ol.Object.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, false, this);
  this.handleGeometryChanged_();
};


/**
 * A function that takes a `{number}` representing the view's resolution. It
 * returns an Array of {@link ol.style.Style}. This way individual features
 * can be styled. The this keyword inside the function references the
 * {@link ol.Feature} to be styled.
 *
 * @typedef {function(this: ol.Feature, number): Array.<ol.style.Style>}
 * @api stable
 */
ol.feature.FeatureStyleFunction;


/**
 * Convert the provided object into a feature style function.  Functions passed
 * through unchanged.  Arrays of ol.style.Style or single style objects wrapped
 * in a new feature style function.
 * @param {ol.feature.FeatureStyleFunction|Array.<ol.style.Style>|
 *     ol.style.Style} obj A feature style function, a single style, or an array
 *     of styles.
 * @return {ol.feature.FeatureStyleFunction} A style function.
 */
ol.feature.createFeatureStyleFunction = function(obj) {
  /**
   * @type {ol.feature.FeatureStyleFunction}
   */
  var styleFunction;

  if (goog.isFunction(obj)) {
    styleFunction = /** @type {ol.feature.FeatureStyleFunction} */ (obj);
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (goog.isArray(obj)) {
      styles = obj;
    } else {
      goog.asserts.assertInstanceof(obj, ol.style.Style);
      styles = [obj];
    }
    styleFunction = goog.functions.constant(styles);
  }
  return styleFunction;
};
