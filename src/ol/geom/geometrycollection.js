goog.provide('ol.geom.GeometryCollection');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.extent');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryType');



/**
 * @classdesc
 * An array of {@link ol.geom.Geometry} objects.
 *
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.Geometry>=} opt_geometries Geometries.
 * @api stable
 */
ol.geom.GeometryCollection = function(opt_geometries) {

  goog.base(this);

  /**
   * @private
   * @type {Array.<ol.geom.Geometry>}
   */
  this.geometries_ = goog.isDef(opt_geometries) ? opt_geometries : null;

  this.listenGeometriesChange_();
};
goog.inherits(ol.geom.GeometryCollection, ol.geom.Geometry);


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 * @private
 * @return {Array.<ol.geom.Geometry>} Cloned geometries.
 */
ol.geom.GeometryCollection.cloneGeometries_ = function(geometries) {
  var clonedGeometries = [];
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    clonedGeometries.push(geometries[i].clone());
  }
  return clonedGeometries;
};


/**
 * @private
 */
ol.geom.GeometryCollection.prototype.unlistenGeometriesChange_ = function() {
  var i, ii;
  if (goog.isNull(this.geometries_)) {
    return;
  }
  for (i = 0, ii = this.geometries_.length; i < ii; ++i) {
    goog.events.unlisten(
        this.geometries_[i], goog.events.EventType.CHANGE,
        this.dispatchChangeEvent, false, this);
  }
};


/**
 * @private
 */
ol.geom.GeometryCollection.prototype.listenGeometriesChange_ = function() {
  var i, ii;
  if (goog.isNull(this.geometries_)) {
    return;
  }
  for (i = 0, ii = this.geometries_.length; i < ii; ++i) {
    goog.events.listen(
        this.geometries_[i], goog.events.EventType.CHANGE,
        this.dispatchChangeEvent, false, this);
  }
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.GeometryCollection} Clone.
 * @api stable
 */
ol.geom.GeometryCollection.prototype.clone = function() {
  var geometryCollection = new ol.geom.GeometryCollection(null);
  geometryCollection.setGeometries(this.geometries_);
  return geometryCollection;
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.closestPointXY =
    function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      ol.extent.closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    minSquaredDistance = geometries[i].closestPointXY(
        x, y, closestPoint, minSquaredDistance);
  }
  return minSquaredDistance;
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.containsXY = function(x, y) {
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    if (geometries[i].containsXY(x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.GeometryCollection.prototype.getExtent = function(opt_extent) {
  if (this.extentRevision != this.getRevision()) {
    var extent = ol.extent.createOrUpdateEmpty(this.extent);
    var geometries = this.geometries_;
    var i, ii;
    for (i = 0, ii = geometries.length; i < ii; ++i) {
      ol.extent.extend(extent, geometries[i].getExtent());
    }
    this.extent = extent;
    this.extentRevision = this.getRevision();
  }
  goog.asserts.assert(goog.isDef(this.extent));
  return ol.extent.returnOrUpdate(this.extent, opt_extent);
};


/**
 * @return {Array.<ol.geom.Geometry>} Geometries.
 * @api stable
 */
ol.geom.GeometryCollection.prototype.getGeometries = function() {
  return ol.geom.GeometryCollection.cloneGeometries_(this.geometries_);
};


/**
 * @return {Array.<ol.geom.Geometry>} Geometries.
 */
ol.geom.GeometryCollection.prototype.getGeometriesArray = function() {
  return this.geometries_;
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.getSimplifiedGeometry =
    function(squaredTolerance) {
  if (this.simplifiedGeometryRevision != this.getRevision()) {
    goog.object.clear(this.simplifiedGeometryCache);
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;
    this.simplifiedGeometryRevision = this.getRevision();
  }
  if (squaredTolerance < 0 ||
      (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
       squaredTolerance < this.simplifiedGeometryMaxMinSquaredTolerance)) {
    return this;
  }
  var key = squaredTolerance.toString();
  if (this.simplifiedGeometryCache.hasOwnProperty(key)) {
    return this.simplifiedGeometryCache[key];
  } else {
    var simplifiedGeometries = [];
    var geometries = this.geometries_;
    var simplified = false;
    var i, ii;
    for (i = 0, ii = geometries.length; i < ii; ++i) {
      var geometry = geometries[i];
      var simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
      simplifiedGeometries.push(simplifiedGeometry);
      if (simplifiedGeometry !== geometry) {
        simplified = true;
      }
    }
    if (simplified) {
      var simplifiedGeometryCollection = new ol.geom.GeometryCollection(null);
      simplifiedGeometryCollection.setGeometriesArray(simplifiedGeometries);
      this.simplifiedGeometryCache[key] = simplifiedGeometryCollection;
      return simplifiedGeometryCollection;
    } else {
      this.simplifiedGeometryMaxMinSquaredTolerance = squaredTolerance;
      return this;
    }
  }
};


/**
 * @inheritDoc
 * @api stable
 */
ol.geom.GeometryCollection.prototype.getType = function() {
  return ol.geom.GeometryType.GEOMETRY_COLLECTION;
};


/**
 * @return {boolean} Is empty.
 */
ol.geom.GeometryCollection.prototype.isEmpty = function() {
  return goog.array.isEmpty(this.geometries_);
};


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 * @api stable
 */
ol.geom.GeometryCollection.prototype.setGeometries = function(geometries) {
  this.setGeometriesArray(
      ol.geom.GeometryCollection.cloneGeometries_(geometries));
};


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 */
ol.geom.GeometryCollection.prototype.setGeometriesArray = function(geometries) {
  this.unlistenGeometriesChange_();
  this.geometries_ = geometries;
  this.listenGeometriesChange_();
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.applyTransform = function(transformFn) {
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].applyTransform(transformFn);
  }
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.geom.GeometryCollection.prototype.disposeInternal = function() {
  this.unlistenGeometriesChange_();
  goog.base(this, 'disposeInternal');
};
