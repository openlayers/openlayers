/**
 * @module ol/render/webgl/MixedGeometryBatch
 */
import {inflateEnds} from '../../geom/flat/orient.js';
import RenderFeature from '../../render/Feature.js';
import {getUid} from '../../util.js';

/**
 * @typedef {import("../../Feature.js").default} Feature
 */
/**
 * @typedef {import("../../geom/Geometry.js").Type} GeometryType
 */

/**
 * @typedef {Object} GeometryBatchItem Object that holds a reference to a feature as well as the raw coordinates of its various geometries
 * @property {Feature|RenderFeature} feature Feature
 * @property {Array<Array<number>>} flatCoordss Array of flat coordinates arrays, one for each geometry related to the feature
 * @property {number} [verticesCount] Only defined for linestring and polygon batches
 * @property {number} [ringsCount] Only defined for polygon batches
 * @property {Array<Array<number>>} [ringsVerticesCounts] Array of vertices counts in each ring for each geometry; only defined for polygons batches
 * @property {number} [ref] The reference in the global batch (used for hit detection)
 */

/**
 * @typedef {PointGeometryBatch|LineStringGeometryBatch|PolygonGeometryBatch} GeometryBatch
 */

/**
 * @typedef {Object} PolygonGeometryBatch A geometry batch specific to polygons
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 * @property {number} ringsCount How many outer and inner rings in this batch.
 */

/**
 * @typedef {Object} LineStringGeometryBatch A geometry batch specific to lines
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 */

/**
 * @typedef {Object} PointGeometryBatch A geometry batch specific to points
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 */

/**
 * @classdesc This class is used to group several geometries of various types together for faster rendering.
 * Three inner batches are maintained for polygons, lines and points. Each time a feature is added, changed or removed
 * from the batch, these inner batches are modified accordingly in order to keep them up-to-date.
 *
 * A feature can be present in several inner batches, for example a polygon geometry will be present in the polygon batch
 * and its linear rings will be present in the line batch. Multi geometries are also broken down into individual geometries
 * and added to the corresponding batches in a recursive manner.
 *
 * Corresponding {@link module:ol/render/webgl/BatchRenderer} instances are then used to generate the render instructions
 * and WebGL buffers (vertices and indices) for each inner batches; render instructions are stored on the inner batches,
 * alongside the transform used to convert world coords to screen coords at the time these instructions were generated.
 * The resulting WebGL buffers are stored on the batches as well.
 *
 * An important aspect of geometry batches is that there is no guarantee that render instructions and WebGL buffers
 * are synchronized, i.e. render instructions can describe a new state while WebGL buffers might not have been written yet.
 * This is why two world-to-screen transforms are stored on each batch: one for the render instructions and one for
 * the WebGL buffers.
 */
class MixedGeometryBatch {
  constructor() {
    /**
     * @private
     */
    this.globalCounter_ = 0;

    /**
     * Refs are used as keys for hit detection.
     * @type {Map<number, Feature|RenderFeature>}
     * @private
     */
    this.refToFeature_ = new Map();

    /**
     * Features are split in "entries", which are individual geometries. We use the following map to share a single ref for all those entries.
     * @type {Map<string, number>}
     * @private
     */
    this.uidToRef_ = new Map();

    /**
     * The precision in WebGL shaders is limited.
     * To keep the refs as small as possible we maintain an array of freed up references.
     * @type {Array<number>}
     * @private
     */
    this.freeGlobalRef_ = [];

    /**
     * @type {PolygonGeometryBatch}
     */
    this.polygonBatch = {
      entries: {},
      geometriesCount: 0,
      verticesCount: 0,
      ringsCount: 0,
    };

    /**
     * @type {PointGeometryBatch}
     */
    this.pointBatch = {
      entries: {},
      geometriesCount: 0,
    };

    /**
     * @type {LineStringGeometryBatch}
     */
    this.lineStringBatch = {
      entries: {},
      geometriesCount: 0,
      verticesCount: 0,
    };
  }

  /**
   * @param {Array<Feature|RenderFeature>} features Array of features to add to the batch
   * @param {import("../../proj.js").TransformFunction} [projectionTransform] Projection transform.
   */
  addFeatures(features, projectionTransform) {
    for (let i = 0; i < features.length; i++) {
      this.addFeature(features[i], projectionTransform);
    }
  }

  /**
   * @param {Feature|RenderFeature} feature Feature to add to the batch
   * @param {import("../../proj.js").TransformFunction} [projectionTransform] Projection transform.
   */
  addFeature(feature, projectionTransform) {
    let geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    if (projectionTransform) {
      geometry = geometry.clone();
      geometry.applyTransform(projectionTransform);
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @return {GeometryBatchItem|void} the cleared entry
   * @private
   */
  clearFeatureEntryInPointBatch_(feature) {
    const featureUid = getUid(feature);
    const entry = this.pointBatch.entries[featureUid];
    if (!entry) {
      return;
    }
    this.pointBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.pointBatch.entries[featureUid];
    return entry;
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @return {GeometryBatchItem|void} the cleared entry
   * @private
   */
  clearFeatureEntryInLineStringBatch_(feature) {
    const featureUid = getUid(feature);
    const entry = this.lineStringBatch.entries[featureUid];
    if (!entry) {
      return;
    }
    this.lineStringBatch.verticesCount -= entry.verticesCount;
    this.lineStringBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.lineStringBatch.entries[featureUid];
    return entry;
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @return {GeometryBatchItem|void} the cleared entry
   * @private
   */
  clearFeatureEntryInPolygonBatch_(feature) {
    const featureUid = getUid(feature);
    const entry = this.polygonBatch.entries[featureUid];
    if (!entry) {
      return;
    }
    this.polygonBatch.verticesCount -= entry.verticesCount;
    this.polygonBatch.ringsCount -= entry.ringsCount;
    this.polygonBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.polygonBatch.entries[featureUid];
    return entry;
  }

  /**
   * @param {import("../../geom.js").Geometry|RenderFeature} geometry Geometry
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  addGeometry_(geometry, feature) {
    const type = geometry.getType();
    switch (type) {
      case 'GeometryCollection': {
        const geometries =
          /** @type {import("../../geom.js").GeometryCollection} */ (
            geometry
          ).getGeometriesArray();
        for (const geometry of geometries) {
          this.addGeometry_(geometry, feature);
        }
        break;
      }
      case 'MultiPolygon': {
        const multiPolygonGeom =
          /** @type {import("../../geom.js").MultiPolygon} */ (geometry);
        this.addCoordinates_(
          type,
          multiPolygonGeom.getFlatCoordinates(),
          multiPolygonGeom.getEndss(),
          feature,
          getUid(feature),
          multiPolygonGeom.getStride(),
        );
        break;
      }
      case 'MultiLineString': {
        const multiLineGeom =
          /** @type {import("../../geom.js").MultiLineString|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiLineGeom.getFlatCoordinates(),
          multiLineGeom.getEnds(),
          feature,
          getUid(feature),
          multiLineGeom.getStride(),
        );
        break;
      }
      case 'MultiPoint': {
        const multiPointGeom =
          /** @type {import("../../geom.js").MultiPoint|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiPointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          multiPointGeom.getStride(),
        );
        break;
      }
      case 'Polygon': {
        const polygonGeom =
          /** @type {import("../../geom.js").Polygon|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          polygonGeom.getFlatCoordinates(),
          polygonGeom.getEnds(),
          feature,
          getUid(feature),
          polygonGeom.getStride(),
        );
        break;
      }
      case 'Point': {
        const pointGeom = /** @type {import("../../geom.js").Point} */ (
          geometry
        );
        this.addCoordinates_(
          type,
          pointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          pointGeom.getStride(),
        );
        break;
      }
      case 'LineString':
      case 'LinearRing': {
        const lineGeom = /** @type {import("../../geom.js").LineString} */ (
          geometry
        );

        const stride = lineGeom.getStride();

        this.addCoordinates_(
          type,
          lineGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature),
          stride,
          lineGeom.getLayout?.(),
        );
        break;
      }
      default:
      // pass
    }
  }

  /**
   * @param {GeometryType} type Geometry type
   * @param {Array<number>} flatCoords Flat coordinates
   * @param {Array<number> | Array<Array<number>> | null} ends Coordinate ends
   * @param {Feature|RenderFeature} feature Feature
   * @param {string} featureUid Feature uid
   * @param {number} stride Stride
   * @param {import('../../geom/Geometry.js').GeometryLayout} [layout] Layout
   * @private
   */
  addCoordinates_(type, flatCoords, ends, feature, featureUid, stride, layout) {
    /** @type {number} */
    let verticesCount;
    switch (type) {
      case 'MultiPolygon': {
        const multiPolygonEndss = /** @type {Array<Array<number>>} */ (ends);
        for (let i = 0, ii = multiPolygonEndss.length; i < ii; i++) {
          let polygonEnds = multiPolygonEndss[i];
          const prevPolygonEnds = i > 0 ? multiPolygonEndss[i - 1] : null;
          const startIndex = prevPolygonEnds
            ? prevPolygonEnds[prevPolygonEnds.length - 1]
            : 0;
          const endIndex = polygonEnds[polygonEnds.length - 1];
          polygonEnds =
            startIndex > 0
              ? polygonEnds.map((end) => end - startIndex)
              : polygonEnds;
          this.addCoordinates_(
            'Polygon',
            flatCoords.slice(startIndex, endIndex),
            polygonEnds,
            feature,
            featureUid,
            stride,
            layout,
          );
        }
        break;
      }
      case 'MultiLineString': {
        const multiLineEnds = /** @type {Array<number>} */ (ends);
        for (let i = 0, ii = multiLineEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? multiLineEnds[i - 1] : 0;
          this.addCoordinates_(
            'LineString',
            flatCoords.slice(startIndex, multiLineEnds[i]),
            null,
            feature,
            featureUid,
            stride,
            layout,
          );
        }
        break;
      }
      case 'MultiPoint':
        for (let i = 0, ii = flatCoords.length; i < ii; i += stride) {
          this.addCoordinates_(
            'Point',
            flatCoords.slice(i, i + 2),
            null,
            feature,
            featureUid,
            null,
            null,
          );
        }
        break;
      case 'Polygon': {
        const polygonEnds = /** @type {Array<number>} */ (ends);
        if (feature instanceof RenderFeature) {
          const multiPolygonEnds = inflateEnds(flatCoords, polygonEnds);
          if (multiPolygonEnds.length > 1) {
            this.addCoordinates_(
              'MultiPolygon',
              flatCoords,
              multiPolygonEnds,
              feature,
              featureUid,
              stride,
              layout,
            );
            return;
          }
        }
        if (!this.polygonBatch.entries[featureUid]) {
          this.polygonBatch.entries[featureUid] = this.addRefToEntry_(
            featureUid,
            {
              feature: feature,
              flatCoordss: [],
              verticesCount: 0,
              ringsCount: 0,
              ringsVerticesCounts: [],
            },
          );
        }
        verticesCount = flatCoords.length / stride;
        const ringsCount = ends.length;
        const ringsVerticesCount = ends.map((end, ind, arr) =>
          ind > 0 ? (end - arr[ind - 1]) / stride : end / stride,
        );
        this.polygonBatch.verticesCount += verticesCount;
        this.polygonBatch.ringsCount += ringsCount;
        this.polygonBatch.geometriesCount++;
        this.polygonBatch.entries[featureUid].flatCoordss.push(
          getFlatCoordinatesXY(flatCoords, stride),
        );
        this.polygonBatch.entries[featureUid].ringsVerticesCounts.push(
          ringsVerticesCount,
        );
        this.polygonBatch.entries[featureUid].verticesCount += verticesCount;
        this.polygonBatch.entries[featureUid].ringsCount += ringsCount;
        for (let i = 0, ii = polygonEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? polygonEnds[i - 1] : 0;
          this.addCoordinates_(
            'LinearRing',
            flatCoords.slice(startIndex, polygonEnds[i]),
            null,
            feature,
            featureUid,
            stride,
            layout,
          );
        }
        break;
      }
      case 'Point':
        if (!this.pointBatch.entries[featureUid]) {
          this.pointBatch.entries[featureUid] = this.addRefToEntry_(
            featureUid,
            {
              feature: feature,
              flatCoordss: [],
            },
          );
        }
        this.pointBatch.geometriesCount++;
        this.pointBatch.entries[featureUid].flatCoordss.push(flatCoords);
        break;
      case 'LineString':
      case 'LinearRing':
        if (!this.lineStringBatch.entries[featureUid]) {
          this.lineStringBatch.entries[featureUid] = this.addRefToEntry_(
            featureUid,
            {
              feature: feature,
              flatCoordss: [],
              verticesCount: 0,
            },
          );
        }
        verticesCount = flatCoords.length / stride;
        this.lineStringBatch.verticesCount += verticesCount;
        this.lineStringBatch.geometriesCount++;
        this.lineStringBatch.entries[featureUid].flatCoordss.push(
          getFlatCoordinatesXYM(flatCoords, stride, layout),
        );
        this.lineStringBatch.entries[featureUid].verticesCount += verticesCount;
        break;
      default:
      // pass
    }
  }

  /**
   * @param {string} featureUid Feature uid
   * @param {GeometryBatchItem} entry The entry to add
   * @return {GeometryBatchItem} the added entry
   * @private
   */
  addRefToEntry_(featureUid, entry) {
    const currentRef = this.uidToRef_.get(featureUid);

    // the ref starts at 1 to distinguish from white color (no feature)
    const ref =
      currentRef || this.freeGlobalRef_.pop() || ++this.globalCounter_;
    entry.ref = ref;
    if (!currentRef) {
      this.refToFeature_.set(ref, entry.feature);
      this.uidToRef_.set(featureUid, ref);
    }
    return entry;
  }

  /**
   * Return a ref to the pool of available refs.
   * @param {number} ref the ref to return
   * @param {string} featureUid the feature uid
   * @private
   */
  removeRef_(ref, featureUid) {
    if (!ref) {
      throw new Error('This feature has no ref: ' + featureUid);
    }
    this.refToFeature_.delete(ref);
    this.uidToRef_.delete(featureUid);
    this.freeGlobalRef_.push(ref);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   */
  changeFeature(feature) {
    // the feature is not present in the batch; do not add it to avoid unexpected behaviors
    if (!this.uidToRef_.get(getUid(feature))) {
      return;
    }
    this.removeFeature(feature);
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   */
  removeFeature(feature) {
    let entry = this.clearFeatureEntryInPointBatch_(feature);
    entry = this.clearFeatureEntryInPolygonBatch_(feature) || entry;
    entry = this.clearFeatureEntryInLineStringBatch_(feature) || entry;
    if (entry) {
      this.removeRef_(entry.ref, getUid(entry.feature));
    }
  }

  clear() {
    this.polygonBatch.entries = {};
    this.polygonBatch.geometriesCount = 0;
    this.polygonBatch.verticesCount = 0;
    this.polygonBatch.ringsCount = 0;
    this.lineStringBatch.entries = {};
    this.lineStringBatch.geometriesCount = 0;
    this.lineStringBatch.verticesCount = 0;
    this.pointBatch.entries = {};
    this.pointBatch.geometriesCount = 0;
    this.globalCounter_ = 0;
    this.freeGlobalRef_ = [];
    this.refToFeature_.clear();
    this.uidToRef_.clear();
  }

  /**
   * Resolve the feature associated to a ref.
   * @param {number} ref Hit detected ref
   * @return {Feature|RenderFeature} feature
   */
  getFeatureFromRef(ref) {
    return this.refToFeature_.get(ref);
  }

  isEmpty() {
    return this.globalCounter_ === 0;
  }

  /**
   * Will return a new instance of this class that only contains the features
   * for which the provided callback returned true
   * @param {function((Feature|RenderFeature)): boolean} featureFilter Feature filter callback
   * @return {MixedGeometryBatch} Filtered geometry batch
   */
  filter(featureFilter) {
    const filtered = new MixedGeometryBatch();
    filtered.globalCounter_ = this.globalCounter_;
    filtered.uidToRef_ = this.uidToRef_;
    filtered.refToFeature_ = this.refToFeature_;
    let empty = true;
    for (const feature of this.refToFeature_.values()) {
      if (featureFilter(feature)) {
        filtered.addFeature(feature);
        empty = false;
      }
    }
    // no feature was added at all; simply return an empty batch for consistency downstream
    if (empty) {
      return new MixedGeometryBatch();
    }
    return filtered;
  }
}

/**
 * @param {Array<number>} flatCoords Flat coords
 * @param {number} stride Stride
 * @return {Array<number>} Flat coords with only XY components
 */
function getFlatCoordinatesXY(flatCoords, stride) {
  if (stride === 2) {
    return flatCoords;
  }
  return flatCoords.filter((v, i) => i % stride < 2);
}

/**
 * @param {Array<number>} flatCoords Flat coords
 * @param {number} stride Stride
 * @param {string} layout Layout
 * @return {Array<number>} Flat coords with only XY components
 */
function getFlatCoordinatesXYM(flatCoords, stride, layout) {
  if (stride === 3 && layout === 'XYM') {
    return flatCoords;
  }
  // this is XYZM layout
  if (stride === 4) {
    return flatCoords.filter((v, i) => i % stride !== 2);
  }
  // this is XYZ layout
  if (stride === 3) {
    return flatCoords.map((v, i) => (i % stride !== 2 ? v : 0));
  }
  // this is XY layout
  return new Array(flatCoords.length * 1.5)
    .fill(0)
    .map((v, i) => (i % 3 === 2 ? 0 : flatCoords[Math.round(i / 1.5)]));
}

export default MixedGeometryBatch;
