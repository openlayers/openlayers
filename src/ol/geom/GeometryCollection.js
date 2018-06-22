/**
 * @module ol/geom/GeometryCollection
 */
import {inherits} from '../util.js';
import {listen, unlisten} from '../events.js';
import EventType from '../events/EventType.js';
import {createOrUpdateEmpty, closestSquaredDistanceXY, extend, getCenter} from '../extent.js';
import Geometry from '../geom/Geometry.js';
import GeometryType from '../geom/GeometryType.js';
import {clear} from '../obj.js';

/**
 * @classdesc
 * An array of {@link module:ol/geom/Geometry} objects.
 *
 * @constructor
 * @extends {module:ol/geom/Geometry}
 * @param {Array.<module:ol/geom/Geometry>=} opt_geometries Geometries.
 * @api
 */
const GeometryCollection = function(opt_geometries) {

  Geometry.call(this);

  /**
   * @private
   * @type {Array.<module:ol/geom/Geometry>}
   */
  this.geometries_ = opt_geometries ? opt_geometries : null;

  this.listenGeometriesChange_();
};

inherits(GeometryCollection, Geometry);


/**
 * @param {Array.<module:ol/geom/Geometry>} geometries Geometries.
 * @return {Array.<module:ol/geom/Geometry>} Cloned geometries.
 */
function cloneGeometries(geometries) {
  const clonedGeometries = [];
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    clonedGeometries.push(geometries[i].clone());
  }
  return clonedGeometries;
}


/**
 * @private
 */
GeometryCollection.prototype.unlistenGeometriesChange_ = function() {
  if (!this.geometries_) {
    return;
  }
  for (let i = 0, ii = this.geometries_.length; i < ii; ++i) {
    unlisten(
      this.geometries_[i], EventType.CHANGE,
      this.changed, this);
  }
};


/**
 * @private
 */
GeometryCollection.prototype.listenGeometriesChange_ = function() {
  if (!this.geometries_) {
    return;
  }
  for (let i = 0, ii = this.geometries_.length; i < ii; ++i) {
    listen(
      this.geometries_[i], EventType.CHANGE,
      this.changed, this);
  }
};


/**
 * Make a complete copy of the geometry.
 * @return {!module:ol/geom/GeometryCollection} Clone.
 * @override
 * @api
 */
GeometryCollection.prototype.clone = function() {
  const geometryCollection = new GeometryCollection(null);
  geometryCollection.setGeometries(this.geometries_);
  return geometryCollection;
};


/**
 * @inheritDoc
 */
GeometryCollection.prototype.closestPointXY = function(x, y, closestPoint, minSquaredDistance) {
  if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
    return minSquaredDistance;
  }
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    minSquaredDistance = geometries[i].closestPointXY(
      x, y, closestPoint, minSquaredDistance);
  }
  return minSquaredDistance;
};


/**
 * @inheritDoc
 */
GeometryCollection.prototype.containsXY = function(x, y) {
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    if (geometries[i].containsXY(x, y)) {
      return true;
    }
  }
  return false;
};


/**
 * @inheritDoc
 */
GeometryCollection.prototype.computeExtent = function(extent) {
  createOrUpdateEmpty(extent);
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    extend(extent, geometries[i].getExtent());
  }
  return extent;
};


/**
 * Return the geometries that make up this geometry collection.
 * @return {Array.<module:ol/geom/Geometry>} Geometries.
 * @api
 */
GeometryCollection.prototype.getGeometries = function() {
  return cloneGeometries(this.geometries_);
};


/**
 * @return {Array.<module:ol/geom/Geometry>} Geometries.
 */
GeometryCollection.prototype.getGeometriesArray = function() {
  return this.geometries_;
};


/**
 * @inheritDoc
 */
GeometryCollection.prototype.getSimplifiedGeometry = function(squaredTolerance) {
  if (this.simplifiedGeometryRevision != this.getRevision()) {
    clear(this.simplifiedGeometryCache);
    this.simplifiedGeometryMaxMinSquaredTolerance = 0;
    this.simplifiedGeometryRevision = this.getRevision();
  }
  if (squaredTolerance < 0 ||
      (this.simplifiedGeometryMaxMinSquaredTolerance !== 0 &&
       squaredTolerance < this.simplifiedGeometryMaxMinSquaredTolerance)) {
    return this;
  }
  const key = squaredTolerance.toString();
  if (this.simplifiedGeometryCache.hasOwnProperty(key)) {
    return this.simplifiedGeometryCache[key];
  } else {
    const simplifiedGeometries = [];
    const geometries = this.geometries_;
    let simplified = false;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      const geometry = geometries[i];
      const simplifiedGeometry = geometry.getSimplifiedGeometry(squaredTolerance);
      simplifiedGeometries.push(simplifiedGeometry);
      if (simplifiedGeometry !== geometry) {
        simplified = true;
      }
    }
    if (simplified) {
      const simplifiedGeometryCollection = new GeometryCollection(null);
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
GeometryCollection.prototype.getType = function() {
  return GeometryType.GEOMETRY_COLLECTION;
};


/**
 * @inheritDoc
 * @api
 */
GeometryCollection.prototype.intersectsExtent = function(extent) {
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    if (geometries[i].intersectsExtent(extent)) {
      return true;
    }
  }
  return false;
};


/**
 * @return {boolean} Is empty.
 */
GeometryCollection.prototype.isEmpty = function() {
  return this.geometries_.length === 0;
};


/**
 * @inheritDoc
 * @api
 */
GeometryCollection.prototype.rotate = function(angle, anchor) {
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].rotate(angle, anchor);
  }
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
GeometryCollection.prototype.scale = function(sx, opt_sy, opt_anchor) {
  let anchor = opt_anchor;
  if (!anchor) {
    anchor = getCenter(this.getExtent());
  }
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].scale(sx, opt_sy, anchor);
  }
  this.changed();
};


/**
 * Set the geometries that make up this geometry collection.
 * @param {Array.<module:ol/geom/Geometry>} geometries Geometries.
 * @api
 */
GeometryCollection.prototype.setGeometries = function(geometries) {
  this.setGeometriesArray(cloneGeometries(geometries));
};


/**
 * @param {Array.<module:ol/geom/Geometry>} geometries Geometries.
 */
GeometryCollection.prototype.setGeometriesArray = function(geometries) {
  this.unlistenGeometriesChange_();
  this.geometries_ = geometries;
  this.listenGeometriesChange_();
  this.changed();
};


/**
 * @inheritDoc
 * @api
 */
GeometryCollection.prototype.applyTransform = function(transformFn) {
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
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
GeometryCollection.prototype.translate = function(deltaX, deltaY) {
  const geometries = this.geometries_;
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    geometries[i].translate(deltaX, deltaY);
  }
  this.changed();
};


/**
 * @inheritDoc
 */
GeometryCollection.prototype.disposeInternal = function() {
  this.unlistenGeometriesChange_();
  Geometry.prototype.disposeInternal.call(this);
};
export default GeometryCollection;
