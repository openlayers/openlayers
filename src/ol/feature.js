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
 * @constructor
 * @extends {ol.Object}
 * @param {ol.geom.Geometry|Object.<string, *>=} opt_geometryOrValues
 *     Values or geometry.
 * @todo stability experimental
 */
ol.Feature = function(opt_geometryOrValues) {

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
   * @private
   * @type {ol.feature.FeatureStyleFunction|undefined}
   */
  this.styleFunction_;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.geometryChangeKey_ = null;

  goog.events.listen(
      this, ol.Object.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, false, this);

  if (goog.isDefAndNotNull(opt_geometryOrValues)) {
    if (opt_geometryOrValues instanceof ol.geom.Geometry) {
      var geometry = /** @type {ol.geom.Geometry} */ (opt_geometryOrValues);
      this.setGeometry(geometry);
    } else {
      goog.asserts.assert(goog.isObject(opt_geometryOrValues));
      var values = /** @type {Object.<string, *>} */ (opt_geometryOrValues);
      this.setValues(values);
    }
  } else {
    this.setGeometry(null);
  }
};
goog.inherits(ol.Feature, ol.Object);


/**
 * @return {ol.geom.Geometry|undefined} Geometry.
 * @todo stability experimental
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
 * @todo stability experimental
 */
ol.Feature.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {string} Geometry property name.
 * @todo stability experimental
 */
ol.Feature.prototype.getGeometryName = function() {
  return this.geometryName_;
};


/**
 * @return {ol.feature.FeatureStyleFunction|undefined} Style function.
 * @todo stability experimental
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
  }
  this.dispatchChangeEvent();
};


/**
 * @param {ol.geom.Geometry|undefined} geometry Geometry.
 * @todo stability experimental
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.set(this.geometryName_, geometry);
};
goog.exportProperty(
    ol.Feature.prototype,
    'setGeometry',
    ol.Feature.prototype.setGeometry);


/**
 * @param {ol.feature.FeatureStyleFunction|undefined} styleFunction Style
 *     function.
 * @todo stability experimental
 */
ol.Feature.prototype.setStyleFunction = function(styleFunction) {
  this.styleFunction_ = styleFunction;
  this.dispatchChangeEvent();
};


/**
 * @param {number|string|undefined} id Id.
 * @todo stability experimental
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;
};


/**
 * @param {string} name Geometry property name.
 * @todo stability experimental
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
 * @typedef {function(this: ol.Feature, number): Array.<ol.style.Style>}
 * @todo stability experimental
 */
ol.feature.FeatureStyleFunction;


/**
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 * @this {ol.Feature}
 * @todo stability experimental
 */
ol.feature.defaultFeatureStyleFunction = goog.functions.constant([]);


/**
 * @typedef {function(ol.Feature, number): Array.<ol.style.Style>}
 * @todo stability experimental
 */
ol.feature.StyleFunction;


/**
 * @param {ol.Feature} feature Feature.
 * @param {number} resolution Resolution.
 * @return {Array.<ol.style.Style>} Style.
 * @todo stability experimental
 */
ol.feature.defaultStyleFunction = function(feature, resolution) {
  var featureStyleFunction = feature.getStyleFunction();
  if (!goog.isDef(featureStyleFunction)) {
    featureStyleFunction = ol.feature.defaultFeatureStyleFunction;
  }
  return featureStyleFunction.call(feature, resolution);
};


/**
 * Convert the provided object into a style function.  Functions passed through
 * unchanged.  Arrays of ol.style.Style or single style objects wrapped in a
 * new style function.
 * @param {ol.feature.StyleFunction|Array.<ol.style.Style>|ol.style.Style} obj
 *     A style function, a single style, or an array of styles.
 * @return {ol.feature.StyleFunction} A style function.
 */
ol.feature.createStyleFunction = function(obj) {
  /**
   * @type {ol.feature.StyleFunction}
   */
  var styleFunction;

  if (goog.isFunction(obj)) {
    styleFunction = /** @type {ol.feature.StyleFunction} */ (obj);
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
    styleFunction = function(feature, resolution) {
      return styles;
    };
  }
  return styleFunction;
};
