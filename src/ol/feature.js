goog.provide('ol.Feature');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Object');
goog.require('ol.geom.Geometry');
goog.require('ol.style.Style');


/**
 * @enum {string}
 */
ol.FeatureProperty = {
  STYLE_FUNCTION: 'styleFunction'
};


/**
 * @typedef {function(this: ol.Feature, number): Array.<ol.style.Style>}
 */
ol.FeatureStyleFunction;



/**
 * @constructor
 * @extends {ol.Object}
 * @param {ol.geom.Geometry|Object.<string, *>=} opt_geometryOrValues
 *     Values or geometry.
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
   * @type {number}
   */
  this.revision_ = 0;

  /**
   * @private
   * @type {goog.events.Key}
   */
  this.geometryChangeKey_ = null;

  goog.events.listen(
      this, ol.Object.getChangeEventType(this.geometryName_),
      this.handleGeometryChanged_, false, this);
  goog.events.listen(
      this, ol.Object.getChangeEventType(ol.FeatureProperty.STYLE_FUNCTION),
      this.handleStyleFunctionChange_, false, this);

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
 * FIXME empty description for jsdoc
 */
ol.Feature.prototype.dispatchChangeEvent = function() {
  ++this.revision_;
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @return {ol.geom.Geometry|undefined} Geometry.
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
 */
ol.Feature.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {string} Geometry property name.
 */
ol.Feature.prototype.getGeometryName = function() {
  return this.geometryName_;
};


/**
 * @return {number} Revision.
 */
ol.Feature.prototype.getRevision = function() {
  return this.revision_;
};


/**
 * @return {ol.FeatureStyleFunction|undefined} Style function.
 */
ol.Feature.prototype.getStyleFunction = function() {
  return /** @type {ol.FeatureStyleFunction|undefined} */ (
      this.get(ol.FeatureProperty.STYLE_FUNCTION));
};
goog.exportProperty(
    ol.Feature.prototype,
    'getStyleFunction',
    ol.Feature.prototype.getStyleFunction);


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
 * @private
 */
ol.Feature.prototype.handleStyleFunctionChange_ = function() {
  this.dispatchChangeEvent();
};


/**
 * @param {ol.geom.Geometry|undefined} geometry Geometry.
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.set(this.geometryName_, geometry);
};
goog.exportProperty(
    ol.Feature.prototype,
    'setGeometry',
    ol.Feature.prototype.setGeometry);


/**
 * @param {ol.FeatureStyleFunction|undefined} styleFunction Style function.
 */
ol.Feature.prototype.setStyleFunction = function(styleFunction) {
  this.set(ol.FeatureProperty.STYLE_FUNCTION, styleFunction);
};
goog.exportProperty(
    ol.Feature.prototype,
    'setStyleFunction',
    ol.Feature.prototype.setStyleFunction);


/**
 * @param {number|string|undefined} id Id.
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;
};


/**
 * @param {string} name Geometry property name.
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
