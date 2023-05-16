/**
 * @module ol/render/webgl/MixedGeometryBatch
 */
import {getUid} from '../../util.js';
import {linearRingIsClockwise} from '../../geom/flat/orient.js';

/**
 * @typedef {import("../../render/Feature").default} RenderFeature
 */
/**
 * @typedef {import("../../Feature").default} Feature
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
   */
  addFeatures(features) {
    for (let i = 0; i < features.length; i++) {
      this.addFeature(features[i]);
    }
  }

  /**
   * @param {Feature|RenderFeature} feature Feature to add to the batch
   */
  addFeature(feature) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInPointBatch_(feature) {
    const entry = this.pointBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.pointBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.pointBatch.entries[getUid(feature)];
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInLineStringBatch_(feature) {
    const entry = this.lineStringBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.lineStringBatch.verticesCount -= entry.verticesCount;
    this.lineStringBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.lineStringBatch.entries[getUid(feature)];
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  clearFeatureEntryInPolygonBatch_(feature) {
    const entry = this.polygonBatch.entries[getUid(feature)];
    if (!entry) {
      return;
    }
    this.polygonBatch.verticesCount -= entry.verticesCount;
    this.polygonBatch.ringsCount -= entry.ringsCount;
    this.polygonBatch.geometriesCount -= entry.flatCoordss.length;
    delete this.polygonBatch.entries[getUid(feature)];
  }

  /**
   * @param {import("../../geom").Geometry|RenderFeature} geometry Geometry
   * @param {Feature|RenderFeature} feature Feature
   * @private
   */
  addGeometry_(geometry, feature) {
    const type = geometry.getType();
    switch (type) {
      case 'GeometryCollection':
        const geometries =
          /** @type {import("../../geom").GeometryCollection} */ (
            geometry
          ).getGeometriesArray();
        for (const geometry of geometries) {
          this.addGeometry_(geometry, feature);
        }
        break;
      case 'MultiPolygon':
        const multiPolygonGeom =
          /** @type {import("../../geom").MultiPolygon|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiPolygonGeom.getFlatCoordinates(),
          multiPolygonGeom.getEndss(),
          feature,
          getUid(feature)
        );
        break;
      case 'MultiLineString':
        const multiLineGeom =
          /** @type {import("../../geom").MultiLineString|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiLineGeom.getFlatCoordinates(),
          multiLineGeom.getEnds(),
          feature,
          getUid(feature)
        );
        break;
      case 'MultiPoint':
        const multiPointGeom =
          /** @type {import("../../geom").MultiPoint|RenderFeature} */ (
            geometry
          );
        this.addCoordinates_(
          type,
          multiPointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature)
        );
        break;
      case 'Polygon':
        const polygonGeom =
          /** @type {import("../../geom").Polygon|RenderFeature} */ (geometry);
        this.addCoordinates_(
          type,
          polygonGeom.getFlatCoordinates(),
          polygonGeom.getEnds(),
          feature,
          getUid(feature)
        );
        break;
      case 'Point':
        const pointGeom = /** @type {import("../../geom").Point} */ (geometry);
        this.addCoordinates_(
          type,
          pointGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature)
        );
        break;
      case 'LineString':
      case 'LinearRing':
        const lineGeom = /** @type {import("../../geom").LineString} */ (
          geometry
        );
        this.addCoordinates_(
          type,
          lineGeom.getFlatCoordinates(),
          null,
          feature,
          getUid(feature)
        );
        break;
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
   * @private
   */
  addCoordinates_(type, flatCoords, ends, feature, featureUid) {
    /** @type {number} */
    let verticesCount;
    switch (type) {
      case 'MultiPolygon':
        const multiPolygonEndss = /** @type {Array<Array<number>>} */ (ends);
        for (let i = 0, ii = multiPolygonEndss.length; i < ii; i++) {
          let polygonEnds = multiPolygonEndss[i];
          const prevPolygonEnds = i > 0 ? multiPolygonEndss[i - 1] : null;
          const startIndex = prevPolygonEnds
            ? prevPolygonEnds[prevPolygonEnds.length - 1]
            : 0;
          const endIndex = polygonEnds[polygonEnds.length - 1];
          const polygonCoords = flatCoords.slice(startIndex, endIndex);
          polygonEnds =
            startIndex > 0
              ? polygonEnds.map((end) => end - startIndex)
              : polygonEnds;
          this.addCoordinates_(
            'Polygon',
            polygonCoords,
            polygonEnds,
            feature,
            featureUid
          );
        }
        break;
      case 'MultiLineString':
        const multiLineEnds = /** @type {Array<number>} */ (ends);
        for (let i = 0, ii = multiLineEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? multiLineEnds[i - 1] : 0;
          const ringCoords = flatCoords.slice(startIndex, multiLineEnds[i]);
          this.addCoordinates_(
            'LinearRing',
            ringCoords,
            null,
            feature,
            featureUid
          );
        }
        break;
      case 'MultiPoint':
        for (let i = 0, ii = flatCoords.length; i < ii; i += 2) {
          this.addCoordinates_(
            'Point',
            flatCoords.slice(i, i + 2),
            null,
            feature,
            featureUid
          );
        }
        break;
      case 'Polygon':
        const polygonEnds = /** @type {Array<number>} */ (ends);
        // first look for a CW ring; if so, handle it and following rings as another polygon
        for (let i = 1, ii = polygonEnds.length; i < ii; i++) {
          const ringStartIndex = polygonEnds[i - 1];
          if (
            i > 0 &&
            linearRingIsClockwise(flatCoords, ringStartIndex, polygonEnds[i], 2)
          ) {
            this.addCoordinates_(
              'Polygon',
              flatCoords.slice(0, ringStartIndex),
              polygonEnds.slice(0, i),
              feature,
              featureUid
            );
            this.addCoordinates_(
              'Polygon',
              flatCoords.slice(ringStartIndex),
              polygonEnds.slice(i).map((end) => end - polygonEnds[i - 1]),
              feature,
              featureUid
            );
            return;
          }
        }
        if (!this.polygonBatch.entries[featureUid]) {
          this.polygonBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
            verticesCount: 0,
            ringsCount: 0,
            ringsVerticesCounts: [],
          };
        }
        verticesCount = flatCoords.length / 2;
        const ringsCount = ends.length;
        const ringsVerticesCount = ends.map((end, ind, arr) =>
          ind > 0 ? (end - arr[ind - 1]) / 2 : end / 2
        );
        this.polygonBatch.verticesCount += verticesCount;
        this.polygonBatch.ringsCount += ringsCount;
        this.polygonBatch.geometriesCount++;
        this.polygonBatch.entries[featureUid].flatCoordss.push(flatCoords);
        this.polygonBatch.entries[featureUid].ringsVerticesCounts.push(
          ringsVerticesCount
        );
        this.polygonBatch.entries[featureUid].verticesCount += verticesCount;
        this.polygonBatch.entries[featureUid].ringsCount += ringsCount;
        for (let i = 0, ii = polygonEnds.length; i < ii; i++) {
          const startIndex = i > 0 ? polygonEnds[i - 1] : 0;
          const ringCoords = flatCoords.slice(startIndex, polygonEnds[i]);
          this.addCoordinates_(
            'LinearRing',
            ringCoords,
            null,
            feature,
            featureUid
          );
        }
        break;
      case 'Point':
        if (!this.pointBatch.entries[featureUid]) {
          this.pointBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
          };
        }
        this.pointBatch.geometriesCount++;
        this.pointBatch.entries[featureUid].flatCoordss.push(flatCoords);
        break;
      case 'LineString':
      case 'LinearRing':
        if (!this.lineStringBatch.entries[featureUid]) {
          this.lineStringBatch.entries[featureUid] = {
            feature: feature,
            flatCoordss: [],
            verticesCount: 0,
          };
        }
        verticesCount = flatCoords.length / 2;
        this.lineStringBatch.verticesCount += verticesCount;
        this.lineStringBatch.geometriesCount++;
        this.lineStringBatch.entries[featureUid].flatCoordss.push(flatCoords);
        this.lineStringBatch.entries[featureUid].verticesCount += verticesCount;
        break;
      default:
      // pass
    }
  }

  /**
   * @param {Feature|RenderFeature} feature Feature
   */
  changeFeature(feature) {
    this.clearFeatureEntryInPointBatch_(feature);
    this.clearFeatureEntryInPolygonBatch_(feature);
    this.clearFeatureEntryInLineStringBatch_(feature);
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
    this.clearFeatureEntryInPointBatch_(feature);
    this.clearFeatureEntryInPolygonBatch_(feature);
    this.clearFeatureEntryInLineStringBatch_(feature);
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
  }
}

export default MixedGeometryBatch;
