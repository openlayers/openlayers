import _ol_asserts_ from './asserts';
import _ol_events_ from './events';
import _ol_events_EventType_ from './events/eventtype';
import _ol_ from './index';
import _ol_Object_ from './object';
import _ol_geom_Geometry_ from './geom/geometry';
import _ol_style_Style_ from './style/style';

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
 * @api
 */
var _ol_Feature_ = function(opt_geometryOrProperties) {

  _ol_Object_.call(this);

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
   * @type {?ol.EventsKey}
   */
  this.geometryChangeKey_ = null;

  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, this);

  if (opt_geometryOrProperties !== undefined) {
    if (opt_geometryOrProperties instanceof _ol_geom_Geometry_ ||
        !opt_geometryOrProperties) {
      var geometry = opt_geometryOrProperties;
      this.setGeometry(geometry);
    } else {
      /** @type {Object.<string, *>} */
      var properties = opt_geometryOrProperties;
      this.setProperties(properties);
    }
  }
};

_ol_.inherits(_ol_Feature_, _ol_Object_);


/**
 * Clone this feature. If the original feature has a geometry it
 * is also cloned. The feature id is not set in the clone.
 * @return {ol.Feature} The clone.
 * @api
 */
_ol_Feature_.prototype.clone = function() {
  var clone = new _ol_Feature_(this.getProperties());
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
 * @api
 * @observable
 */
_ol_Feature_.prototype.getGeometry = function() {
  return /** @type {ol.geom.Geometry|undefined} */ (
    this.get(this.geometryName_));
};


/**
 * Get the feature identifier.  This is a stable identifier for the feature and
 * is either set when reading data from a remote source or set explicitly by
 * calling {@link ol.Feature#setId}.
 * @return {number|string|undefined} Id.
 * @api
 */
_ol_Feature_.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the name of the feature's default geometry.  By default, the default
 * geometry is named `geometry`.
 * @return {string} Get the property name associated with the default geometry
 *     for this feature.
 * @api
 */
_ol_Feature_.prototype.getGeometryName = function() {
  return this.geometryName_;
};


/**
 * Get the feature's style. Will return what was provided to the
 * {@link ol.Feature#setStyle} method.
 * @return {ol.style.Style|Array.<ol.style.Style>|
 *     ol.FeatureStyleFunction|ol.StyleFunction} The feature style.
 * @api
 */
_ol_Feature_.prototype.getStyle = function() {
  return this.style_;
};


/**
 * Get the feature's style function.
 * @return {ol.FeatureStyleFunction|undefined} Return a function
 * representing the current style of this feature.
 * @api
 */
_ol_Feature_.prototype.getStyleFunction = function() {
  return this.styleFunction_;
};


/**
 * @private
 */
_ol_Feature_.prototype.handleGeometryChange_ = function() {
  this.changed();
};


/**
 * @private
 */
_ol_Feature_.prototype.handleGeometryChanged_ = function() {
  if (this.geometryChangeKey_) {
    _ol_events_.unlistenByKey(this.geometryChangeKey_);
    this.geometryChangeKey_ = null;
  }
  var geometry = this.getGeometry();
  if (geometry) {
    this.geometryChangeKey_ = _ol_events_.listen(geometry,
        _ol_events_EventType_.CHANGE, this.handleGeometryChange_, this);
  }
  this.changed();
};


/**
 * Set the default geometry for the feature.  This will update the property
 * with the name returned by {@link ol.Feature#getGeometryName}.
 * @param {ol.geom.Geometry|undefined} geometry The new geometry.
 * @api
 * @observable
 */
_ol_Feature_.prototype.setGeometry = function(geometry) {
  this.set(this.geometryName_, geometry);
};


/**
 * Set the style for the feature.  This can be a single style object, an array
 * of styles, or a function that takes a resolution and returns an array of
 * styles. If it is `null` the feature has no style (a `null` style).
 * @param {ol.style.Style|Array.<ol.style.Style>|
 *     ol.FeatureStyleFunction|ol.StyleFunction} style Style for this feature.
 * @api
 * @fires ol.events.Event#event:change
 */
_ol_Feature_.prototype.setStyle = function(style) {
  this.style_ = style;
  this.styleFunction_ = !style ?
    undefined : _ol_Feature_.createStyleFunction(style);
  this.changed();
};


/**
 * Set the feature id.  The feature id is considered stable and may be used when
 * requesting features or comparing identifiers returned from a remote source.
 * The feature id can be used with the {@link ol.source.Vector#getFeatureById}
 * method.
 * @param {number|string|undefined} id The feature id.
 * @api
 * @fires ol.events.Event#event:change
 */
_ol_Feature_.prototype.setId = function(id) {
  this.id_ = id;
  this.changed();
};


/**
 * Set the property name to be used when getting the feature's default geometry.
 * When calling {@link ol.Feature#getGeometry}, the value of the property with
 * this name will be returned.
 * @param {string} name The property name of the default geometry.
 * @api
 */
_ol_Feature_.prototype.setGeometryName = function(name) {
  _ol_events_.unlisten(
      this, _ol_Object_.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, this);
  this.geometryName_ = name;
  _ol_events_.listen(
      this, _ol_Object_.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, this);
  this.handleGeometryChanged_();
};


/**
 * Convert the provided object into a feature style function.  Functions passed
 * through unchanged.  Arrays of ol.style.Style or single style objects wrapped
 * in a new feature style function.
 * @param {ol.FeatureStyleFunction|!Array.<ol.style.Style>|!ol.style.Style} obj
 *     A feature style function, a single style, or an array of styles.
 * @return {ol.FeatureStyleFunction} A style function.
 */
_ol_Feature_.createStyleFunction = function(obj) {
  var styleFunction;

  if (typeof obj === 'function') {
    if (obj.length == 2) {
      styleFunction = function(resolution) {
        return /** @type {ol.StyleFunction} */ (obj)(this, resolution);
      };
    } else {
      styleFunction = obj;
    }
  } else {
    /**
     * @type {Array.<ol.style.Style>}
     */
    var styles;
    if (Array.isArray(obj)) {
      styles = obj;
    } else {
      _ol_asserts_.assert(obj instanceof _ol_style_Style_,
          41); // Expected an `ol.style.Style` or an array of `ol.style.Style`
      styles = [obj];
    }
    styleFunction = function() {
      return styles;
    };
  }
  return styleFunction;
};
export default _ol_Feature_;
