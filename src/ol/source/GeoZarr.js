/**
 * @module ol/source/GeoZarr
 */

import {FetchStore, get, open, slice} from 'zarrita';
import {getCenter} from '../extent.js';
import {toUserCoordinate, toUserExtent} from '../proj.js';
import {toSize} from '../size.js';
import WMTSTileGrid from '../tilegrid/WMTS.js';
import DataTileSource from './DataTile.js';
import {parseTileMatrixSet} from './ogcTileUtil.js';

/**
 * @typedef {Object} Options
 * @property {string} url The Zarr URL.
 * @property {string} group The group with arrays to render.
 * @property {Array<string>} bands The band names to render.
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.  If not provided, the GeoTIFF metadata
 * will be read for projection information.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 */

export default class GeoZarr extends DataTileSource {
  /**
   * @param {Options} options The options.
   */
  constructor(options) {
    super({
      state: 'loading',
      tileGrid: null,
      projection: options.projection || null,
      transition: options.transition,
      wrapX: options.wrapX,
    });

    /**
     * @type {string}
     */
    this.url_ = options.url;

    /**
     * @type {string}
     */
    this.group_ = options.group;

    /**
     * @type {Error|null}
     */
    this.error_ = null;

    /**
     * @type {import('zarrita').Group<any>}
     */
    this.root_ = null;

    /**
     * @type {Array<string>}
     */
    this.bands_ = options.bands;

    this.setLoader(this.loadTile_.bind(this));

    /**
     * @type {import("../tilegrid/WMTS.js").default}
     */
    this.tileGrid;

    this.configure_()
      .then(() => {
        this.setState('ready');
      })
      .catch((err) => {
        this.error_ = err;
        this.setState('error');
      });
  }

  async configure_() {
    const store = new FetchStore(this.url_);

    this.root_ = await open(store, {kind: 'group'});

    // const consolidatedMetadata = JSON.parse(
    //   new TextDecoder().decode(
    //     await store.get(this.root_.resolve('zarr.json').path),
    //   ),
    // );
    // console.log(consolidatedMetadata);

    const group = await open(this.root_.resolve(this.group_), {kind: 'group'});

    /**
     * @type {import('./ogcTileUtil.js').SourceInfo}
     */
    const sourceInfo = {};

    /**
     * @type {Object<string, any>}
     */
    const attributes = group.attrs;

    /**
     * @type {import('./ogcTileUtil.js').TileMatrixSet}
     */
    const tileMatrixSet = attributes.multiscales.tile_matrix_set;
    const tileMatrixLimitsObject = attributes.multiscales.tile_matrix_limits;

    const numMatrices = tileMatrixSet.tileMatrices.length;
    const tileMatrixLimits = new Array(numMatrices);
    let overrideTileSize = false;
    for (let i = 0; i < numMatrices; i += 1) {
      const tileMatrix = tileMatrixSet.tileMatrices[i];
      const tilematrixId = tileMatrix.id;
      if (tileMatrix.tileWidth > 512 || tileMatrix.tileHeight > 512) {
        // Avoid tile sizes that are too large for rendering
        overrideTileSize = true;
      }
      tileMatrixLimits[i] = tileMatrixLimitsObject[tilematrixId];
    }

    const info = parseTileMatrixSet(
      sourceInfo,
      tileMatrixSet,
      undefined,
      tileMatrixLimits,
    );

    let tileGrid = info.grid;

    // Tile size sanity check
    if (overrideTileSize) {
      tileGrid = new WMTSTileGrid({
        tileSize: 512,
        extent: tileGrid.getExtent(),
        origins: tileGrid.getOrigins(),
        resolutions: tileGrid.getResolutions(),
        matrixIds: tileGrid.getMatrixIds(),
      });
    }

    /**
     * @override
     * @type {import("../tilegrid/WMTS.js").default}
     */
    this.tileGrid = tileGrid;
    this.projection = info.projection;

    const extent = this.tileGrid.getExtent();
    this.viewResolver({
      showFullExtent: true,
      projection: this.projection,
      resolutions: this.tileGrid.getResolutions(),
      center: toUserCoordinate(getCenter(extent), this.projection),
      extent: toUserExtent(extent, this.projection),
      zoom: 1,
    });
  }

  /**
   * @param {number} z The z tile index.
   * @param {number} x The x tile index.
   * @param {number} y The y tile index.
   * @param {import('./DataTile.js').LoaderOptions} options The loader options.
   * @return {Promise} The composed tile data.
   * @private
   */
  async loadTile_(z, x, y, options) {
    const tileMatrixId = this.tileGrid.getMatrixId(z);
    const tileExtent = this.tileGrid.getTileCoordExtent([z, x, y]);

    const resolution = this.tileGrid.getResolution(z);
    const origin = this.tileGrid.getOrigin(z);
    const [width, height] = toSize(this.tileGrid.getTileSize(z));

    const minCol = Math.round((tileExtent[0] - origin[0]) / resolution);
    const maxCol = Math.round((tileExtent[2] - origin[0]) / resolution);

    const minRow = Math.round((origin[1] - tileExtent[3]) / resolution);
    const maxRow = Math.round((origin[1] - tileExtent[1]) / resolution);

    const bandPromises = [];
    for (const band of this.bands_) {
      const path = `${this.group_}/${tileMatrixId}/${band}`;
      const array = await open(this.root_.resolve(path), {kind: 'array'});
      bandPromises.push(
        get(array, [slice(minRow, maxRow), slice(minCol, maxCol)]),
      );
    }

    const bandDatas = await Promise.all(bandPromises);
    const bandCount = bandDatas.length;
    const resampledData = new Float32Array(width * height * bandCount);
    // Copy the available data into the correct position
    for (let row = 0; row < width; row++) {
      for (let col = 0; col < height; col++) {
        for (let band = 0; band < bandCount; ++band) {
          const data = bandDatas[band];
          const gotHeight = data.shape[0];
          const gotWidth = data.shape[1];
          // get value from band tileData if within row/col count, use 0 otherwise
          //TODO use fillvalue from metadata instead of 0
          let value = 0;
          if (row < gotHeight && col < gotWidth) {
            value = data.data[row * gotWidth + col];
          }
          resampledData[bandCount * (row * width + col) + band] = value;
        }
      }
    }
    return resampledData;
  }
}
