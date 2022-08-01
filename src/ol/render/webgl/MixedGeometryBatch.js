/**
 * @module ol/render/webgl/MixedGeometryBatch
 */
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {create as createTransform} from '../../transform.js';
import {getUid} from '../../util.js';

/**
 * @typedef {Object} GeometryBatchItem Object that holds a reference to a feature as well as the raw coordinates of its various geometries
 * @property {import("../../Feature").default} feature Feature
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
 * @property {Float32Array} renderInstructions Render instructions for polygons are structured like so:
 * [ numberOfRings, numberOfVerticesInRing0, ..., numberOfVerticesInRingN, x0, y0, customAttr0, ..., xN, yN, customAttrN, numberOfRings,... ]
 * @property {WebGLArrayBuffer} verticesBuffer Vertices WebGL buffer
 * @property {WebGLArrayBuffer} indicesBuffer Indices WebGL buffer
 * @property {import("../../transform.js").Transform} renderInstructionsTransform Converts world space coordinates to screen space; applies to the rendering instructions
 * @property {import("../../transform.js").Transform} verticesBufferTransform Converts world space coordinates to screen space; applies to the webgl vertices buffer
 * @property {import("../../transform.js").Transform} invertVerticesBufferTransform Screen space to world space; applies to the webgl vertices buffer
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 * @property {number} ringsCount How many outer and inner rings in this batch.
 */

/**
 * @typedef {Object} LineStringGeometryBatch A geometry batch specific to lines
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {Float32Array} renderInstructions Render instructions for polygons are structured like so:
 * [ numberOfRings, numberOfVerticesInRing0, ..., numberOfVerticesInRingN, x0, y0, customAttr0, ..., xN, yN, customAttrN, numberOfRings,... ]
 * @property {WebGLArrayBuffer} verticesBuffer Vertices WebGL buffer
 * @property {WebGLArrayBuffer} indicesBuffer Indices WebGL buffer
 * @property {import("../../transform.js").Transform} renderInstructionsTransform Converts world space coordinates to screen space; applies to the rendering instructions
 * @property {import("../../transform.js").Transform} verticesBufferTransform Converts world space coordinates to screen space; applies to the webgl vertices buffer
 * @property {import("../../transform.js").Transform} invertVerticesBufferTransform Screen space to world space; applies to the webgl vertices buffer
 * @property {number} verticesCount Amount of vertices from geometries in the batch.
 */

/**
 * @typedef {Object} PointGeometryBatch A geometry batch specific to points
 * @property {Object<string, GeometryBatchItem>} entries Dictionary of all entries in the batch with associated computed values.
 * One entry corresponds to one feature. Key is feature uid.
 * @property {number} geometriesCount Amount of geometries in the batch.
 * @property {Float32Array} renderInstructions Render instructions for polygons are structured like so:
 * [ numberOfRings, numberOfVerticesInRing0, ..., numberOfVerticesInRingN, x0, y0, customAttr0, ..., xN, yN, customAttrN, numberOfRings,... ]
 * @property {WebGLArrayBuffer} verticesBuffer Vertices WebGL buffer
 * @property {WebGLArrayBuffer} indicesBuffer Indices WebGL buffer
 * @property {import("../../transform.js").Transform} renderInstructionsTransform Converts world space coordinates to screen space; applies to the rendering instructions
 * @property {import("../../transform.js").Transform} verticesBufferTransform Converts world space coordinates to screen space; applies to the webgl vertices buffer
 * @property {import("../../transform.js").Transform} invertVerticesBufferTransform Screen space to world space; applies to the webgl vertices buffer
 */

/**
 * @classdesc This class is used to group several geometries of various types together for faster rendering.
 * Three inner batches are maintained for polygons, lines and points. Each time a feature is added, changed or removed
 * from the batch, these inner batches are modified accordingly in order to keep them up-to-date.
 *
 * A feature can be present in several inner batches, for example a polygon geometry will be present in the polygon batch
 * and its linar rings will be present in the line batch. Multi geometries are also broken down into individual geometries
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
      renderInstructions: new Float32Array(0),
      verticesBuffer: new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW),
      indicesBuffer: new WebGLArrayBuffer(ELEMENT_ARRAY_BUFFER, DYNAMIC_DRAW),
      renderInstructionsTransform: createTransform(),
      verticesBufferTransform: createTransform(),
      invertVerticesBufferTransform: createTransform(),
    };

    /**
     * @type {PointGeometryBatch}
     */
    this.pointBatch = {
      entries: {},
      geometriesCount: 0,
      renderInstructions: new Float32Array(0),
      verticesBuffer: new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW),
      indicesBuffer: new WebGLArrayBuffer(ELEMENT_ARRAY_BUFFER, DYNAMIC_DRAW),
      renderInstructionsTransform: createTransform(),
      verticesBufferTransform: createTransform(),
      invertVerticesBufferTransform: createTransform(),
    };

    /**
     * @type {LineStringGeometryBatch}
     */
    this.lineStringBatch = {
      entries: {},
      geometriesCount: 0,
      verticesCount: 0,
      renderInstructions: new Float32Array(0),
      verticesBuffer: new WebGLArrayBuffer(ARRAY_BUFFER, DYNAMIC_DRAW),
      indicesBuffer: new WebGLArrayBuffer(ELEMENT_ARRAY_BUFFER, DYNAMIC_DRAW),
      renderInstructionsTransform: createTransform(),
      verticesBufferTransform: createTransform(),
      invertVerticesBufferTransform: createTransform(),
    };
  }

  /**
   * @param {Array<import("../../Feature").default>} features Array of features to add to the batch
   */
  addFeatures(features) {
    for (let i = 0; i < features.length; i++) {
      this.addFeature(features[i]);
    }
  }

  /**
   * @param {import("../../Feature").default} feature Feature to add to the batch
   */
  addFeature(feature) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.addGeometry_(geometry, feature);
  }

  /**
   * @param {import("../../Feature").default} feature Feature
   * @return {GeometryBatchItem} Batch item added (or existing one)
   * @private
   */
  addFeatureEntryInPointBatch_(feature) {
    const uid = getUid(feature);
    if (!(uid in this.pointBatch.entries)) {
      this.pointBatch.entries[uid] = {
        feature: feature,
        flatCoordss: [],
      };
    }
    return this.pointBatch.entries[uid];
  }

  /**
   * @param {import("../../Feature").default} feature Feature
   * @return {GeometryBatchItem} Batch item added (or existing one)
   * @private
   */
  addFeatureEntryInLineStringBatch_(feature) {
    const uid = getUid(feature);
    if (!(uid in this.lineStringBatch.entries)) {
      this.lineStringBatch.entries[uid] = {
        feature: feature,
        flatCoordss: [],
        verticesCount: 0,
      };
    }
    return this.lineStringBatch.entries[uid];
  }

  /**
   * @param {import("../../Feature").default} feature Feature
   * @return {GeometryBatchItem} Batch item added (or existing one)
   * @private
   */
  addFeatureEntryInPolygonBatch_(feature) {
    const uid = getUid(feature);
    if (!(uid in this.polygonBatch.entries)) {
      this.polygonBatch.entries[uid] = {
        feature: feature,
        flatCoordss: [],
        verticesCount: 0,
        ringsCount: 0,
        ringsVerticesCounts: [],
      };
    }
    return this.polygonBatch.entries[uid];
  }

  /**
   * @param {import("../../Feature").default} feature Feature
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
   * @param {import("../../Feature").default} feature Feature
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
   * @param {import("../../Feature").default} feature Feature
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
   * @param {import("../../geom").Geometry} geometry Geometry
   * @param {import("../../Feature").default} feature Feature
   * @private
   */
  addGeometry_(geometry, feature) {
    const type = geometry.getType();
    let flatCoords;
    let verticesCount;
    let batchEntry;
    switch (type) {
      case 'GeometryCollection':
        /** @type {import("../../geom").GeometryCollection} */ (geometry)
          .getGeometries()
          .map((geom) => this.addGeometry_(geom, feature));
        break;
      case 'MultiPolygon':
        /** @type {import("../../geom").MultiPolygon} */ (geometry)
          .getPolygons()
          .map((polygon) => this.addGeometry_(polygon, feature));
        break;
      case 'MultiLineString':
        /** @type {import("../../geom").MultiLineString} */ (geometry)
          .getLineStrings()
          .map((line) => this.addGeometry_(line, feature));
        break;
      case 'MultiPoint':
        /** @type {import("../../geom").MultiPoint} */ (geometry)
          .getPoints()
          .map((point) => this.addGeometry_(point, feature));
        break;
      case 'Polygon':
        const polygonGeom = /** @type {import("../../geom").Polygon} */ (
          geometry
        );
        batchEntry = this.addFeatureEntryInPolygonBatch_(feature);
        flatCoords = polygonGeom.getFlatCoordinates();
        verticesCount = flatCoords.length / 2;
        const ringsCount = polygonGeom.getLinearRingCount();
        const ringsVerticesCount = polygonGeom
          .getEnds()
          .map((end, ind, arr) =>
            ind > 0 ? (end - arr[ind - 1]) / 2 : end / 2
          );
        this.polygonBatch.verticesCount += verticesCount;
        this.polygonBatch.ringsCount += ringsCount;
        this.polygonBatch.geometriesCount++;
        batchEntry.flatCoordss.push(flatCoords);
        batchEntry.ringsVerticesCounts.push(ringsVerticesCount);
        batchEntry.verticesCount += verticesCount;
        batchEntry.ringsCount += ringsCount;
        polygonGeom
          .getLinearRings()
          .map((ring) => this.addGeometry_(ring, feature));
        break;
      case 'Point':
        const pointGeom = /** @type {import("../../geom").Point} */ (geometry);
        batchEntry = this.addFeatureEntryInPointBatch_(feature);
        flatCoords = pointGeom.getFlatCoordinates();
        this.pointBatch.geometriesCount++;
        batchEntry.flatCoordss.push(flatCoords);
        break;
      case 'LineString':
      case 'LinearRing':
        const lineGeom = /** @type {import("../../geom").LineString} */ (
          geometry
        );
        batchEntry = this.addFeatureEntryInLineStringBatch_(feature);
        flatCoords = lineGeom.getFlatCoordinates();
        verticesCount = flatCoords.length / 2;
        this.lineStringBatch.verticesCount += verticesCount;
        this.lineStringBatch.geometriesCount++;
        batchEntry.flatCoordss.push(flatCoords);
        batchEntry.verticesCount += verticesCount;
        break;
      default:
      // pass
    }
  }

  /**
   * @param {import("../../Feature").default} feature Feature
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
   * @param {import("../../Feature").default} feature Feature
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
