goog.provide('ol.Feature');
goog.provide('ol.FeatureStyleFunction');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol');
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
 * style of their vector layer.
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
   *     ol.FeatureStyleFunction}
   */
  this.style_ = null;

  /**
   * @private
   * @type {ol.FeatureStyleFunction|undefined}
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

  if (opt_geometryOrProperties !== undefined) {
    if (opt_geometryOrProperties instanceof ol.geom.Geometry ||
        !opt_geometryOrProperties) {
      var geometry = /** @type {ol.geom.Geometry} */ (opt_geometryOrProperties);
      this.setGeometry(geometry);
    } else {
      goog.asserts.assert(goog.isObject(opt_geometryOrProperties),
          'opt_geometryOrProperties should be an Object');
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
  if (geometry) {
    clone.setGeometry(geometry.clone());
  }
  var style = this.getStyle();
  if (style) {
    clone.setStyle(style);
  }
  return clone;
};


/**
 * Get the feature's default geometry.  A feature may have any number of named
 * geometries.  The "default" geometry (the one that is rendered by default) is
 * set when calling {@link ol.Feature#setGeometry}.
 * @return {ol.geom.Geometry|undefined} The default geometry for the feature.
 * @api stable
 * @observable
 */
ol.Feature.prototype.getGeometry = function() {
  return /** @type {ol.geom.Geometry|undefined} */ (
      this.get(this.geometryName_));
};


/**
 * Get the feature identifier.  This is a stable identifier for the feature and
 * is either set when reading data from a remote source or set explicitly by
 * calling {@link ol.Feature#setId}.
 * @return {number|string|undefined} Id.
 * @api stable
 * @observable
 */
ol.Feature.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the name of the feature's default geometry.  By default, the default
 * geometry is named `geometry`.
 * @return {string} Get the property name associated with the default geometry
 *     for this feature.
 * @api stable
 */
ol.Feature.prototype.getGeometryName = function() {
  return this.geometryName_;
};


/**
 * Get the feature's style.  This return for this method depends on what was
 * provided to the {@link ol.Feature#setStyle} method.
 * @return {ol.style.Style|Array.<ol.style.Style>|
 *     ol.FeatureStyleFunction} The feature style.
 * @api stable
 * @observable
 */
ol.Feature.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the feature's style function.
 * @return {ol.FeatureStyleFunction|undefined} Return a function
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
  this.changed();
};


/**
 * @private
 */
ol.Feature.prototype.handleGeometryChanged_ = function() {
  if (this.geometryChangeKey_) {
    goog.events.unlistenByKey(this.geometryChangeKey_);
    this.geometryChangeKey_ = null;
  }
  var geometry = this.getGeometry();
  if (geometry) {
    this.geometryChangeKey_ = goog.events.listen(geometry,
        goog.events.EventType.CHANGE, this.handleGeometryChange_, false, this);
  }
  this.changed();
};


/**
 * Set the default geometry for the feature.  This will update the property
 * with the name returned by {@link ol.Feature#getGeometryName}.
 * @param {ol.geom.Geometry|undefined} geometry The new geometry.
 * @api stable
 * @observable
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.set(this.geometryName_, geometry);
};


/**
 * Set the style for the feature.  This can be a single style object, an array
 * of styles, or a function that takes a resolution and returns an array of
 * styles. If it is `null` the feature has no style (a `null` style).
 * @param {ol.style.Style|Array.<ol.style.Style>|
 *     ol.FeatureStyleFunction} style Style for this feature.
 * @api stable
 * @observable
 */
ol.Feature.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = !style ?
      undefined : ol.Feature.createStyleFunction(style);
  this.changed();
};


/**
 * Set the feature id.  The feature id is considered stable and may be used when
 * requesting features or comparing identifiers returned from a remote source.
 * The feature id can be used with the {@link ol.source.Vector#getFeatureById}
 * method.
 * @param {number|string|undefined} id The feature id.
 * @api stable
 * @observable
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;
  this.changed();
};


/**
 * Set the property name to be used when getting the feature's default geometry.
 * When calling {@link ol.Feature#getGeometry}, the value of the property with
 * this name will be returned.
 * @param {string} name The property name of the default geometry.
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
 * A function that returns an array of {@link ol.style.Style styles} given a
 * resolution. The `this` keyword inside the function references the
 * {@link ol.Feature} to be styled.
 *
 * @typedef {function(this: ol.Feature, number): Array.<ol.style.Style>}
 * @api stable
 */
ol.FeatureStyleFunction;


/**
 * Convert the provided object into a feature style function.  Functions passed
 * through unchanged.  Arrays of ol.style.Style or single style objects wrapped
 * in a new feature style function.
 * @param {ol.FeatureStyleFunction|!Array.<ol.style.Style>|!ol.style.Style} obj
 *     A feature style function, a single style, or an array of styles.
 * @return {ol.FeatureStyleFunction} A style function.
 */
ol.Feature.createStyleFunction = function(obj) {
  var styleFunction;

  if (goog.isFunction(obj)) {
    styleFunction = obj;
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (goog.isArray(obj)) {
      styles = obj;
    } else {
      goog.asserts.assertInstanceof(obj, ol.style.Style,
          'obj should be an ol.style.Style');
      styles = [obj];
    }
    styleFunction = function() {
      return styles;
    };
  }
  return styleFunction;
};
