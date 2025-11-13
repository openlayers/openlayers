/**
 * @module ol/source/GeoZarr
 */

import {FetchStore, get, open, slice} from 'zarrita';
import {getCenter} from '../extent.js';
import {get as getProjection, toUserCoordinate, toUserExtent} from '../proj.js';
import {toSize} from '../size.js';
import WMTSTileGrid from '../tilegrid/WMTS.js';
import DataTileSource from './DataTile.js';
import {parseTileMatrixSet} from './ogcTileUtil.js';

/**
 * @typedef {'nearest'|'linear'} ResampleMethod
 */

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
 * @property {ResampleMethod} [resample='nearest'] Resamplilng method if bands are not available for all multi-scale levels.
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

    /**
     * @type {Object<string, Array<string>> | null}
     */
    this.bandsByLevel_ = null;

    /**
     * @type {ResampleMethod}
     */
    this.resampleMethod_ = options.resample || 'linear';

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

    const attributes =
      /** @type {LegacyDatasetAttributes | DatasetAttributes} */ (group.attrs);

    if ('tile_matrix_set' in attributes.multiscales) {
      const {tileGrid, projection} = getTileGridInfoFromLegacyAttributes(
        /** @type {LegacyDatasetAttributes} */ (attributes),
      );
      this.tileGrid = tileGrid;
      this.projection = projection;
    } else if ('layout' in attributes.multiscales) {
      const {tileGrid, projection} = getTileGridInfoFromAttributes(
        /** @type {DatasetAttributes} */ (attributes),
      );
      this.tileGrid = tileGrid;
      this.projection = projection;
    }

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
    const [colCount, rowCount] = toSize(this.tileGrid.getTileSize(z));

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

    const bandChunks = await Promise.all(bandPromises);
    return composeData(bandChunks, colCount, rowCount, this.resampleMethod_);
  }
}

/**
 * @typedef {Object} DatasetAttributes
 * @property {Multiscales} multiscales The multiscales attribute.
 */

/**
 * @typedef {Object} Multiscales
 * @property {Object} layout The layout.
 */

/**
 * @typedef {Object} LegacyDatasetAttributes
 * @property {LegacyMultiscales} multiscales The multiscales attribute.
 */

/**
 * @typedef {Object} LegacyMultiscales
 * @property {any} tile_matrix_limits The tile matrix limits.
 * @property {any} tile_matrix_set The tile matrix set.
 */

/**
 * @typedef {Object} TileGridInfo
 * @property {WMTSTileGrid} tileGrid The tile grid.
 * @property {import("../proj/Projection.js").default} projection The projection.
 */

/**
 * @param {DatasetAttributes} attributes The dataset attributes.
 * @return {TileGridInfo} The tile grid info.
 */
function getTileGridInfoFromAttributes(attributes) {
  const multiscales = attributes.multiscales;
  const extent = attributes['proj:bbox'];
  const projection = getProjection(attributes['proj:code']);
  /** @type {Array<{matrixId: string, resolution: number}>} */
  const groupInfo = [];
  for (const group of multiscales.layout) {
    //TODO Handle the complete transform (rotation and different x/y resolutions)
    const transform = group['proj:transform'];
    const resolution = transform[0];
    const matrixId = group.group;
    groupInfo.push({
      matrixId,
      resolution,
    });
  }
  groupInfo.sort((a, b) => b.resolution - a.resolution);
  const tileGrid = new WMTSTileGrid({
    extent: extent,
    resolutions: groupInfo.map((g) => g.resolution),
    matrixIds: groupInfo.map((g) => g.matrixId),
  });

  return {tileGrid, projection};
}

/**
 * @param {LegacyDatasetAttributes} attributes The dataset attributes.
 * @return {TileGridInfo} The tile grid info.
 */
function getTileGridInfoFromLegacyAttributes(attributes) {
  const multiscales = attributes.multiscales;
  const tileMatrixSet = multiscales.tile_matrix_set;
  const tileMatrixLimitsObject = multiscales.tile_matrix_limits;

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
    {},
    tileMatrixSet,
    undefined,
    tileMatrixLimits,
  );

  let tileGrid = info.grid;

  // Tile size sanity
  if (overrideTileSize) {
    tileGrid = new WMTSTileGrid({
      tileSize: 512,
      extent: tileGrid.getExtent(),
      origins: tileGrid.getOrigins(),
      resolutions: tileGrid.getResolutions(),
      matrixIds: tileGrid.getMatrixIds(),
    });
  }
  return {tileGrid, projection: info.projection};
}

/**
 * @param {Array<import("zarrita").Chunk<import("zarrita").DataType>>} bandChunks The input chunks.
 * @param {number} colCount The number of columns in the output data.
 * @param {number} rowCount The number of rows in the output data.
 * @param {ResampleMethod} resampleMethod The resampling method.
 * @return {Float32Array} The tile data.
 */
function composeData(bandChunks, colCount, rowCount, resampleMethod) {
  const bandCount = bandChunks.length;
  const tileData = new Float32Array(colCount * rowCount * bandCount);
  // Copy the available data into the correct position
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      for (let band = 0; band < bandCount; ++band) {
        const chunk = bandChunks[band];
        const chunkRowCount = chunk.shape[0];
        const chunkColCount = chunk.shape[1];
        // get value from band tileData if within row/col count, use 0 otherwise
        // TODO use fillvalue from metadata instead of 0
        let value = 0;
        if (row < chunkRowCount && col < chunkColCount) {
          value = chunk.data[row * chunkColCount + col];
        }
        tileData[bandCount * (row * colCount + col) + band] = value;
      }
    }
  }
  return tileData;
}
