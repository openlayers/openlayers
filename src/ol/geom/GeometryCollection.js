/**
 * @module ol/geom/GeometryCollection
 */
import {listen, unlisten} from '../events.js';
import EventType from '../events/EventType.js';
import {createOrUpdateEmpty, closestSquaredDistanceXY, extend, getCenter} from '../extent.js';
import Geometry from './Geometry.js';
import GeometryType from './GeometryType.js';
import {clear} from '../obj.js';

/**
 * @classdesc
 * An array of {@link module:ol/geom/Geometry} objects.
 *
 * @api
 */
class GeometryCollection extends Geometry {

  /**
   * @param {Array<Geometry>=} opt_geometries Geometries.
   */
  constructor(opt_geometries) {

    super();

    /**
     * @private
     * @type {Array<Geometry>}
     */
    this.geometries_ = opt_geometries ? opt_geometries : null;

    this.listenGeometriesChange_();
  }

  /**
   * @private
   */
  unlistenGeometriesChange_() {
    if (!this.geometries_) {
      return;
    }
    for (let i = 0, ii = this.geometries_.length; i < ii; ++i) {
      unlisten(
        this.geometries_[i], EventType.CHANGE,
        this.changed, this);
    }
  }

  /**
   * @private
   */
  listenGeometriesChange_() {
    if (!this.geometries_) {
      return;
    }
    for (let i = 0, ii = this.geometries_.length; i < ii; ++i) {
      listen(
        this.geometries_[i], EventType.CHANGE,
        this.changed, this);
    }
  }

  /**
   * Make a complete copy of the geometry.
   * @return {!GeometryCollection} Clone.
   * @override
   * @api
   */
  clone() {
    const geometryCollection = new GeometryCollection(null);
    geometryCollection.setGeometries(this.geometries_);
    return geometryCollection;
  }

  /**
   * @inheritDoc
   */
  closestPointXY(x, y, closestPoint, minSquaredDistance) {
    if (minSquaredDistance < closestSquaredDistanceXY(this.getExtent(), x, y)) {
      return minSquaredDistance;
    }
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      minSquaredDistance = geometries[i].closestPointXY(
        x, y, closestPoint, minSquaredDistance);
    }
    return minSquaredDistance;
  }

  /**
   * @inheritDoc
   */
  containsXY(x, y) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      if (geometries[i].containsXY(x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  computeExtent(extent) {
    createOrUpdateEmpty(extent);
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      extend(extent, geometries[i].getExtent());
    }
    return extent;
  }

  /**
   * Return the geometries that make up this geometry collection.
   * @return {Array<Geometry>} Geometries.
   * @api
   */
  getGeometries() {
    return cloneGeometries(this.geometries_);
  }

  /**
   * @return {Array<Geometry>} Geometries.
   */
  getGeometriesArray() {
    return this.geometries_;
  }

  /**
   * @inheritDoc
   */
  getSimplifiedGeometry(squaredTolerance) {
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
  }

  /**
   * @inheritDoc
   * @api
   */
  getType() {
    return GeometryType.GEOMETRY_COLLECTION;
  }

  /**
   * @inheritDoc
   * @api
   */
  intersectsExtent(extent) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      if (geometries[i].intersectsExtent(extent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @return {boolean} Is empty.
   */
  isEmpty() {
    return this.geometries_.length === 0;
  }

  /**
   * @inheritDoc
   * @api
   */
  rotate(angle, anchor) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].rotate(angle, anchor);
    }
    this.changed();
  }

  /**
   * @inheritDoc
   * @api
   */
  scale(sx, opt_sy, opt_anchor) {
    let anchor = opt_anchor;
    if (!anchor) {
      anchor = getCenter(this.getExtent());
    }
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].scale(sx, opt_sy, anchor);
    }
    this.changed();
  }

  /**
   * Set the geometries that make up this geometry collection.
   * @param {Array<Geometry>} geometries Geometries.
   * @api
   */
  setGeometries(geometries) {
    this.setGeometriesArray(cloneGeometries(geometries));
  }

  /**
   * @param {Array<Geometry>} geometries Geometries.
   */
  setGeometriesArray(geometries) {
    this.unlistenGeometriesChange_();
    this.geometries_ = geometries;
    this.listenGeometriesChange_();
    this.changed();
  }

  /**
   * @inheritDoc
   * @api
   */
  applyTransform(transformFn) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].applyTransform(transformFn);
    }
    this.changed();
  }

  /**
   * @inheritDoc
   * @api
   */
  translate(deltaX, deltaY) {
    const geometries = this.geometries_;
    for (let i = 0, ii = geometries.length; i < ii; ++i) {
      geometries[i].translate(deltaX, deltaY);
    }
    this.changed();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.unlistenGeometriesChange_();
    super.disposeInternal();
  }
}


/**
 * @param {Array<Geometry>} geometries Geometries.
 * @return {Array<Geometry>} Cloned geometries.
 */
function cloneGeometries(geometries) {
  const clonedGeometries = [];
  for (let i = 0, ii = geometries.length; i < ii; ++i) {
    clonedGeometries.push(geometries[i].clone());
  }
  return clonedGeometries;
}


export default GeometryCollection;
