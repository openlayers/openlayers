/**
 * @module ol/source/Interpolated
 */
import DataTileSource from './DataTile.js';
import {
  buffer as bufferExtent,
  createEmpty as createEmptyExtent,
} from '../extent.js';
import {toSize} from '../size.js';
import {wrapX} from '../tilegrid.js';

/**
 * @typedef {Object} InverseDistanceWeightConfig
 * @property {number} [maxDistance=Infinity] The maximum distance to interpolate from a point.
 * @property {number} [power=2] The power property used in calculating the weight (weight = 1 / distance^power).
 */

/**
 * @type {InverseDistanceWeightConfig}
 */
const inverseDistanceWeightDefaults = {
  maxDistance: Infinity,
  power: 2,
};

/**
 * @typedef {Object} Options
 * @property {import("./Vector.js").default<import("../geom/Point.js").default>} source Source with point data to interpolate.
 * @property {number} valueCount The number of values that will be interpolated.
 * @property {InverseDistanceWeightConfig} [config] Optional configuration for the interpolation method.
 * @property {function(import("../Feature.js").default):Array<number>} values A function that returns an array of values given a feature.
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize=[256, 256]] The pixel width and height of the source tiles.
 * This may be different than the rendered pixel size if a `tileGrid` is provided.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 */

/**
 * @param {Options} options The source options.
 * @return {InverseDistanceWeightConfig} The interpolation method configuration.
 */
function getConfig(options) {
  if (!options.config) {
    return inverseDistanceWeightDefaults;
  }
  return Object.assign({}, inverseDistanceWeightDefaults, options.config);
}

const tempExtent = createEmptyExtent();

/**
 * @param {import("../geom/Point.js").default} point A point geometry.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @return {number} The distance from the geometry to the coordinate.
 */
function getDistance(point, x, y) {
  const coordinates = point.getFlatCoordinates();
  const dx = coordinates[0] - x;
  const dy = coordinates[1] - y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * @classdesc
 * A that generates tiles with pixel values representing interpolated point values.
 */
class InterpolatedSource extends DataTileSource {
  /**
   * @param {Options} options Interpolated source options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      tileSize: options.tileSize,
      maxResolution: options.maxResolution,
      projection: options.projection,
      tileGrid: options.tileGrid,
      transition: 0,
    });

    /**
     * @type {import("./Vector.js").default<import("../geom/Point.js").default>}
     * @private
     */
    this.source_ = options.source;

    /**
     * @type {InverseDistanceWeightConfig}
     * @private
     */
    this.config_ = getConfig(options);

    this.setLoader(this.inverseDistanceWeightLoader_.bind(this));

    /**
     * @type {number}
     * @private
     */
    this.valueCount_ = options.valueCount;

    /**
     * @type {function(import("../Feature.js").default):Array<number>}
     * @private
     */
    this.valueGetter_ = options.values;
  }

  /**
   * @param {number} z Tile zoom level.
   * @param {number} x Tile column number.
   * @param {number} y Tile row number.
   * @return {Promise<Uint8Array>} The tile data.
   */
  async inverseDistanceWeightLoader_(z, x, y) {
    const projection = this.getProjection();
    const tileGrid = this.getTileGridForProjection(projection);
    const tileCoord = wrapX(tileGrid, [z, x, y], projection);

    const tileExtent = tileGrid.getTileCoordExtent(tileCoord, tempExtent);
    const tileExtentMinX = tileExtent[0];
    const tileExtentMaxY = tileExtent[3];

    const maxDistance = this.config_.maxDistance;
    const power = this.config_.power;

    /**
     * @type {Array<import("../Feature.js").default<import("../geom/Point.js").default>>}
     */
    let features;

    if (maxDistance !== Infinity) {
      const bufferedExtent = bufferExtent(tileExtent, maxDistance, tempExtent);
      features = this.source_.getFeaturesInExtent(bufferedExtent, projection);
    } else {
      features = this.source_.getFeatures();
    }

    const resolution = tileGrid.getResolution(z);
    const tileSize = toSize(tileGrid.getTileSize(z));
    const numRows = tileSize[1];
    const numCols = tileSize[0];
    const data = new Uint8Array(numRows * numCols * this.valueCount_);
    const valuesSum = new Array(this.valueCount_);

    for (let row = 0; row < numRows; ++row) {
      const coordY = tileExtentMaxY - row * resolution;
      let offset = row * numCols * this.valueCount_;

      for (let col = 0; col < numCols; ++col) {
        const coordX = tileExtentMinX + col * resolution;
        let weightSum = 0;
        let count = 0;
        valuesSum.fill(0);
        for (let i = 0, ii = features.length; i < ii; ++i) {
          const feature = features[i];
          const distance = getDistance(feature.getGeometry(), coordX, coordY);
          if (distance > maxDistance) {
            continue;
          }
          count += 1;
          const weight = 1 / Math.pow(distance, power);
          weightSum += weight;

          const values = this.valueGetter_(feature);
          for (let j = 0; j < this.valueCount_; ++j) {
            valuesSum[j] += weight * values[j];
          }
        }

        if (count !== 0) {
          for (let i = 0; i < this.valueCount_; ++i) {
            data[offset + i] = valuesSum[i] / weightSum;
          }
        }
        offset += this.valueCount_;
      }
    }

    return data;
  }
}

export default InterpolatedSource;
