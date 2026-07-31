/**
 * @module ol/source/CoordinateTile
 */

import DataTileSource from './DataTile.js';
import {equivalent, get as getProjection, getTransform} from '../proj.js';
import {toSize} from '../size.js';

/**
 * @typedef {Object} Options
 * @property {number|import("../size.js").Size} [tileSize] The pixel width and height of the source tiles.
 * @property {import("../proj.js").ProjectionLike} [dataProjection='EPSG:4326'] The projection for coordinates that to be encoded in tiles.
 * @property {boolean} [wrapX=true] Render tiles beyond the antimeridian.
 * @property {number} [transition] Transition time when fading in new tiles (in milliseconds).
 * @property {number} [padding=0] padding for reversing the gutter.
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
      tileSize: options.tileSize,
      projection: null,
      tileGrid: null,
      wrapX: options.wrapX !== false,
      transition: options.transition,
      interpolate: false,
      bandCount: 2,
    });

    this.dataProjection_ = getProjection(options.dataProjection || 'EPSG:4326');
    this.transform_ = null;

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
    const grid = this.getTileGridForProjection(this.getProjection());
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

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} viewProjection Projection.
   * @return {import("../DataTile.js").default|null} Tile (or null if outside source extent).
   * @override
   */
  getTile(z, x, y, pixelRatio, viewProjection) {
    if (!this.projection || !equivalent(this.projection, viewProjection)) {
      // always use view projection
      this.projection = viewProjection;
      this.transform_ = getTransform(
        this.getProjection(),
        this.dataProjection_,
      );
      this.setKey(
        `coordinate/${this.dataProjection_.getCode()}/${this.getProjection().getCode()}`,
      );
      this.clear();
    }

    return super.getTile(z, x, y, pixelRatio, viewProjection);
  }

  /**
   * @return {number} The padding.
   */
  getPadding() {
    return this.padding_;
  }
}

export default CoordinateTileSource;
