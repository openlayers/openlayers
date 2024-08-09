/**
 * @module ol/source/CoordinateTile
 */

import DataTileSource from './DataTile.js';
import {get as getProjection, getTransform} from '../proj.js';
import {toSize} from '../size.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [maxZoom=42] Optional max zoom level. Not used if `tileGrid` is provided.
 * @property {number} [minZoom=0] Optional min zoom level. Not used if `tileGrid` is provided.
 * @property {number|import("../size.js").Size} [tileSize] The pixel width and height of the source tiles.
 * This may be different than the rendered pixel size if a `tileGrid` is provided.
 * @property {number} [maxResolution] Optional tile grid resolution at level zero. Not used if `tileGrid` is provided.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Tile projection.
 * @property {import("../proj.js").ProjectionLike} [dataProjection='EPSG:4326'] Data projection.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid.
 * @property {import("./Source.js").State} [state] The source state.
 * @property {boolean} [wrapX=false] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in milliseconds).
 * @property {number} [bandCount=4] Number of bands represented in the data.
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {string} [key] Key for use in caching tiles.
 * @property {number} [padding=0] padding for gutter.
 */

/**
 * @classdesc
 * A source for coordinate data tiles.
 *
 * @extends DataTileSource<import("../DataTile.js").default>
 * @fires import("./Tile.js").TileSourceEvent
 * @api
 */
class CoordinateTileSource extends DataTileSource {
  /**
   * @param {Options} [options] options.
   */
  constructor(options) {
    options = options || {};
    super({
      loader: (z, x, y) => this.loadTileData_(z, x, y),
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      tileSize: options.tileSize,
      maxResolution: options.maxResolution,
      projection: options.projection,
      tileGrid: options.tileGrid,
      state: options.state,
      wrapX: options.wrapX !== false,
      transition: options.transition,
      interpolate: options.interpolate !== false,
    });

    const dataProjection = getProjection(options.dataProjection || 'EPSG:4326');
    this.setKey(
      `coordinate/${dataProjection.getCode()}/${this.getProjection().getCode()}/${options.key || ''}`,
    );

    this.transform_ = getTransform(this.getProjection(), dataProjection);

    this.padding_ = options.padding || 0;

    const [width, height] = toSize(options.tileSize ?? 256);
    this.tmpCoord_ = new Array(width * height * 2);
    this.tmpPoint_ = new Array(width * height * 2);
  }

  /**
   * @param {Array<number>} tileCoord Tile coordinate
   * @return {Promise<Float32Array>} data
   */
  async loadTileData_(...tileCoord) {
    await new Promise((resolve) => setTimeout(resolve, 0));

    const [z] = tileCoord;
    const [width, height] = this.getTileSize(z);
    const grid = this.getTileGrid();
    const tileSize = toSize(grid.getTileSize(z));

    const scale_x = (tileSize[0] + this.padding_ * 2) / tileSize[0];
    const scale_y = (tileSize[1] + this.padding_ * 2) / tileSize[1];

    const extent = grid.getTileCoordExtent(tileCoord);

    // scale around center for padding
    const deltaX = ((extent[2] - extent[0]) / 2) * (scale_x - 1);
    const deltaY = ((extent[3] - extent[1]) / 2) * (scale_y - 1);
    extent[0] -= deltaX;
    extent[2] += deltaX;
    extent[1] -= deltaY;
    extent[3] += deltaY;

    const coord = this.tmpCoord_;
    const point = this.tmpPoint_;

    let idx = 0;
    const resolution_x = (extent[2] - extent[0]) / width;
    const resolution_y = (extent[3] - extent[1]) / height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        coord[idx++] = extent[0] + resolution_x * x;
        coord[idx++] = extent[3] - resolution_y * y;
      }
    }

    this.transform_(coord, point, 2);

    return new Float32Array(point);
  }

  getPadding() {
    return this.padding_;
  }
}

export default CoordinateTileSource;
