goog.provide('ol.Feature');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Object');
goog.require('ol.geom.Geometry');


/**
 * @enum {string}
 */
ol.FeatureProperty = {
  GEOMETRY: 'geometry'
};



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
      this, ol.Object.getChangeEventType(ol.FeatureProperty.GEOMETRY),
      this.handleGeometryChanged_, false, this);

  if (goog.isDef(opt_geometryOrValues)) {
    if (opt_geometryOrValues instanceof ol.geom.Geometry) {
      var geometry = /** @type {ol.geom.Geometry} */ (opt_geometryOrValues);
      this.setGeometry(geometry);
    } else {
      goog.asserts.assert(goog.isObject(opt_geometryOrValues));
      var values = /** @type {Object.<string, *>} */ (opt_geometryOrValues);
      this.setValues(values);
    }
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
      this.get(ol.FeatureProperty.GEOMETRY));
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
 * @return {number} Revision.
 */
ol.Feature.prototype.getRevision = function() {
  return this.revision_;
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
 */
ol.Feature.prototype.setGeometry = function(geometry) {
  this.set(ol.FeatureProperty.GEOMETRY, geometry);
};
goog.exportProperty(
    ol.Feature.prototype,
    'setGeometry',
    ol.Feature.prototype.setGeometry);


/**
 * @param {number|string|undefined} id Id.
 */
ol.Feature.prototype.setId = function(id) {
  this.id_ = id;
};
