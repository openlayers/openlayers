import _ol_ from '../index';
import _ol_events_ from '../events';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_extent_ from '../extent';
import _ol_geom_Geometry_ from '../geom/geometry';
import _ol_geom_GeometryType_ from '../geom/geometrytype';
import _ol_obj_ from '../obj';

/**
 * @classdesc
 * An array of {@link ol.geom.Geometry} objects.
 *
 * @constructor
 * @extends {ol.geom.Geometry}
 * @param {Array.<ol.geom.Geometry>=} opt_geometries Geometries.
 * @api
 */
var _ol_geom_GeometryCollection_ = function(opt_geometries) {

  _ol_geom_Geometry_.call(this);

  /**
   * @private
   * @type {Array.<ol.geom.Geometry>}
   */
  this.geometries_ = opt_geometries ? opt_geometries : null;

  this.listenGeometriesChange_();
};

_ol_.inherits(_ol_geom_GeometryCollection_, _ol_geom_Geometry_);


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 * @private
 * @return {Array.<ol.geom.Geometry>} Cloned geometries.
 */
_ol_geom_GeometryCollection_.cloneGeometries_ = function(geometries) {
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
_ol_geom_GeometryCollection_.prototype.unlistenGeometriesChange_ = function() {
  var i, ii;
  if (!this.geometries_) {
    return;
  }
  for (i = 0, ii = this.geometries_.length; i < ii; ++i) {
    _ol_events_.unlisten(
        this.geometries_[i], _ol_events_EventType_.CHANGE,
        this.changed, this);
  }
};


/**
 * @private
 */
_ol_geom_GeometryCollection_.prototype.listenGeometriesChange_ = function() {
  var i, ii;
  if (!this.geometries_) {
    return;
  }
  for (i = 0, ii = this.geometries_.length; i < ii; ++i) {
    _ol_events_.listen(
        this.geometries_[i], _ol_events_EventType_.CHANGE,
        this.changed, this);
  }
};


/**
 * Make a complete copy of the geometry.
 * @return {!ol.geom.GeometryCollection} Clone.
 * @override
 * @api
 */
_ol_geom_GeometryCollection_.prototype.clone = function() {
  var geometryCollection = new _ol_geom_GeometryCollection_(null);
  geometryCollection.setGeometries(this.geometries_);
  return geometryCollection;
};


/**
 * @inheritDoc
 */
_ol_geom_GeometryCollection_.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance <
      _ol_extent_.closestSquaredDistanceXY(this.getExtent(), x, y)) {
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
_ol_geom_GeometryCollection_.prototype.containsXY = function(x, y) {
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
 */
_ol_geom_GeometryCollection_.prototype.computeExtent = function(extent) {
  _ol_extent_.createOrUpdateEmpty(extent);
  var geometries = this.geometries_;
  for (var i = 0, ii = geometries.length; i < ii; ++i) {
    _ol_extent_.extend(extent, geometries[i].getExtent());
  }
  return extent;
};


/**
 * Return the geometries that make up this geometry collection.
 * @return {Array.<ol.geom.Geometry>} Geometries.
 * @api
 */
_ol_geom_GeometryCollection_.prototype.getGeometries = function() {
  return _ol_geom_GeometryCollection_.cloneGeometries_(this.geometries_);
};


/**
 * @return {Array.<ol.geom.Geometry>} Geometries.
 */
_ol_geom_GeometryCollection_.prototype.getGeometriesArray = function() {
  return this.geometries_;
};


/**
 * @inheritDoc
 */
_ol_geom_GeometryCollection_.prototype.getSimplifiedGeometry = function(squaredTolerance) {
  if (this.simplifiedGeometryRevision != this.getRevision()) {
    _ol_obj_.clear(this.simplifiedGeometryCache);
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
      var simplifiedGeometryCollection = new _ol_geom_GeometryCollection_(null);
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
 * @api
 */
_ol_geom_GeometryCollection_.prototype.getType = function() {
  return _ol_geom_GeometryType_.GEOMETRY_COLLECTION;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_GeometryCollection_.prototype.intersectsExtent = function(extent) {
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    if (geometries[i].intersectsExtent(extent)) {
      return true;
    }
  }
  return false;
};


/**
 * @return {boolean} Is empty.
 */
_ol_geom_GeometryCollection_.prototype.isEmpty = function() {
  return this.geometries_.length === 0;
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_GeometryCollection_.prototype.rotate = function(angle, anchor) {
  var geometries = this.geometries_;
  for (var i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].rotate(angle, anchor);
  }
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_GeometryCollection_.prototype.scale = function(sx, opt_sy, opt_anchor) {
  var anchor = opt_anchor;
  if (!anchor) {
    anchor = _ol_extent_.getCenter(this.getExtent());
  }
  var geometries = this.geometries_;
  for (var i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].scale(sx, opt_sy, anchor);
  }
  this.changed();
};


/**
 * Set the geometries that make up this geometry collection.
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 * @api
 */
_ol_geom_GeometryCollection_.prototype.setGeometries = function(geometries) {
  this.setGeometriesArray(
      _ol_geom_GeometryCollection_.cloneGeometries_(geometries));
};


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries.
 */
_ol_geom_GeometryCollection_.prototype.setGeometriesArray = function(geometries) {
  this.unlistenGeometriesChange_();
  this.geometries_ = geometries;
  this.listenGeometriesChange_();
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
_ol_geom_GeometryCollection_.prototype.applyTransform = function(transformFn) {
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].applyTransform(transformFn);
  }
  this.changed();
};


/**
 * Translate the geometry.
 * @param {number} deltaX Delta X.
 * @param {number} deltaY Delta Y.
 * @override
 * @api
 */
_ol_geom_GeometryCollection_.prototype.translate = function(deltaX, deltaY) {
  var geometries = this.geometries_;
  var i, ii;
  for (i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].translate(deltaX, deltaY);
  }
  this.changed();
};


/**
 * @inheritDoc
 */
_ol_geom_GeometryCollection_.prototype.disposeInternal = function() {
  this.unlistenGeometriesChange_();
  _ol_geom_Geometry_.prototype.disposeInternal.call(this);
};
export default _ol_geom_GeometryCollection_;
