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

const REQUIRED_ZARR_CONVENTIONS = [
  'd35379db-88df-4056-af3a-620245f8e347', // multiscales
  'f17cb550-5864-4468-aeb7-f3180cfb622f', // proj:
  '689b58e2-cf7b-45e0-9fff-9cfc0883d6b4', // spatial:
];

/**
 * @typedef {'nearest'|'linear'} ResampleMethod
 */

/**
 * @typedef {Object} Options
 * @property {string} url The Zarr URL.
 * @property {string} group The group with arrays to render.
 * @property {Array<string>} bands The band names to render.
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.  If not provided, the GeoZarr metadata
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
     * @type {any|null}
     */
    this.consolidatedMetadata_ = null;

    /**
     * @type {Array<string>}
     */
    this.bands_ = options.bands;

    /**
     * @type {Object<string, Array<string>> | null}
     */
    this.bandsByLevel_ = null;

    /**
     * @type {number|undefined}
     */
    this.fillValue_;

    /**
     * @type {ResampleMethod}
     */
    this.resampleMethod_ = options.resample || 'linear';

    /**
     * @type {number} Number of bands.
     */
    this.bandCount = this.bands_.length;

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

    try {
      this.consolidatedMetadata_ = JSON.parse(
        new TextDecoder().decode(
          await store.get(this.root_.resolve('zarr.json').path),
        ),
      ).consolidated_metadata.metadata;
    } catch {
      // empty catch block
    }

    const group = await open(this.root_.resolve(this.group_), {kind: 'group'});

    const attributes =
      /** @type {LegacyDatasetAttributes | DatasetAttributes} */ (group.attrs);

    if (
      'zarr_conventions' in attributes &&
      Array.isArray(attributes.zarr_conventions) &&
      REQUIRED_ZARR_CONVENTIONS.every((uuid) =>
        attributes.zarr_conventions.find((c) => c.uuid === uuid),
      ) &&
      'layout' in attributes.multiscales
    ) {
      const {tileGrid, projection, bandsByLevel, fillValue} =
        getTileGridInfoFromAttributes(
          /** @type {DatasetAttributes} */ (attributes),
          this.consolidatedMetadata_,
          this.group_,
          this.bands_,
        );
      this.bandsByLevel_ = bandsByLevel;
      this.tileGrid = tileGrid;
      this.projection = projection;
      this.fillValue_ = fillValue;
    }
    if ('tile_matrix_set' in attributes.multiscales) {
      // If available, use tile_matrix_set (legacy attributes) to get a tile grid, because it
      // provides a better mapping of tiles to zarr chunks.
      const {tileGrid, projection} = getTileGridInfoFromLegacyAttributes(
        /** @type {LegacyDatasetAttributes} */ (attributes),
      );
      this.tileGrid = tileGrid;
      if (!this.projection) {
        // If there were no required zarr conventions, we don't have a projection yet
        this.projection = projection;
      }
    }
    if (!this.tileGrid) {
      throw new Error('Could not determine tile grid');
    }

    const extent = this.tileGrid.getExtent();
    setTimeout(() => {
      this.viewResolver({
        showFullExtent: true,
        projection: this.projection,
        resolutions: this.tileGrid.getResolutions(),
        center: toUserCoordinate(getCenter(extent), this.projection),
        extent: toUserExtent(extent, this.projection),
        zoom: 1,
      });
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
    const resolutions = this.tileGrid.getResolutions();
    const tileResolution = this.tileGrid.getResolution(z);
    const tileExtent = this.tileGrid.getTileCoordExtent([z, x, y]);

    const bandPromises = [];
    const bandResolutions = [];
    for (const band of this.bands_) {
      let bandMatrixId;
      let bandResolution;
      let bandZ = 0;

      if (!this.bandsByLevel_) {
        // TODO: remove this if we stop supporting legacy attributes
        bandMatrixId = this.tileGrid.getMatrixId(z);
        bandResolution = tileResolution;
        bandZ = z;
      } else {
        for (
          let candidateZ = 0;
          candidateZ < resolutions.length;
          candidateZ += 1
        ) {
          const candidateResolution = resolutions[candidateZ];
          if (bandMatrixId && candidateResolution < tileResolution) {
            break;
          }
          const candidateMatrixId = this.tileGrid.getMatrixId(candidateZ);
          if (this.bandsByLevel_[candidateMatrixId].includes(band)) {
            bandMatrixId = candidateMatrixId;
            bandResolution = this.tileGrid.getResolution(candidateZ);
            bandZ = candidateZ;
          }
        }
      }

      if (!bandMatrixId || !bandResolution) {
        throw new Error(`Could not find available resolution for band ${band}`);
      }

      const origin = this.tileGrid.getOrigin(bandZ);
      const minCol = Math.round((tileExtent[0] - origin[0]) / bandResolution);
      const maxCol = Math.round((tileExtent[2] - origin[0]) / bandResolution);

      const minRow = Math.round((origin[1] - tileExtent[3]) / bandResolution);
      const maxRow = Math.round((origin[1] - tileExtent[1]) / bandResolution);

      const path = `${this.group_}/${bandMatrixId}/${band}`;
      const array = await open(this.root_.resolve(path), {kind: 'array'});
      bandPromises.push(
        get(array, [slice(minRow, maxRow), slice(minCol, maxCol)]),
      );
      bandResolutions.push(bandResolution);
    }

    const bandChunks = await Promise.all(bandPromises);
    const [tileColCount, tileRowCount] = toSize(this.tileGrid.getTileSize(z));
    return composeData(
      bandChunks,
      bandResolutions,
      tileColCount,
      tileRowCount,
      tileResolution,
      this.resampleMethod_,
      this.fillValue_ || 0,
    );
  }
}

/**
 * @typedef {Object} DatasetAttributes
 * @property {Multiscales} multiscales The multiscales attribute.
 * @property {Array<{uuid: string}>} zarr_conventions The zarr conventions attribute.
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
 * @property {Object<string, Array<string>>} [bandsByLevel] Available bands by level.
 * @property {number} [fillValue] The fill value.
 */

/**
 * @param {DatasetAttributes} attributes The dataset attributes.
 * @param {any} consolidatedMetadata The consolidated metadata.
 * @param {string} wantedGroup The path to the wanted group.
 * @param {Array<string>} wantedBands The wanted bands.
 * @return {TileGridInfo} The tile grid info.
 */
function getTileGridInfoFromAttributes(
  attributes,
  consolidatedMetadata,
  wantedGroup,
  wantedBands,
) {
  const multiscales = attributes.multiscales;
  const extent = attributes['spatial:bbox'];
  const projection = getProjection(attributes['proj:code']);
  /** @type {Array<{matrixId: string, resolution: number, origin: import("ol/coordinate").Coordinate}>} */
  const groupInfo = [];
  const bandsByLevel = consolidatedMetadata ? {} : null;
  let fillValue;
  for (const groupMetadata of multiscales.layout) {
    //TODO Handle the complete transform (rotation and different x/y resolutions)
    const transform = groupMetadata['spatial:transform'];
    const resolution = transform[0];
    const origin = [transform[2], transform[5]];
    const matrixId = groupMetadata.asset;
    groupInfo.push({
      matrixId,
      resolution,
      origin,
    });
    if (consolidatedMetadata) {
      const availableBands = [];
      for (const band of wantedBands) {
        const bandArray =
          consolidatedMetadata[`${wantedGroup}/${matrixId}/${band}`];
        if (bandArray) {
          availableBands.push(band);
          if (fillValue === undefined) {
            fillValue = bandArray['fill_value'];
          }
        }
      }
      bandsByLevel[matrixId] = availableBands;
    }
  }
  groupInfo.sort((a, b) => b.resolution - a.resolution);
  const tileGrid = new WMTSTileGrid({
    extent: extent,
    origins: groupInfo.map((g) => g.origin),
    resolutions: groupInfo.map((g) => g.resolution),
    matrixIds: groupInfo.map((g) => g.matrixId),
  });

  return {tileGrid, projection, bandsByLevel, fillValue};
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
 * @param {Array<import("zarrita").Chunk<import("zarrita").DataType>>} chunks The input chunks.
 * @param {Array<number>} chunkResolutions The resolutions for each band.
 * @param {number} tileColCount The number of columns in the output data.
 * @param {number} tileRowCount The number of rows in the output data.
 * @param {number} tileResolution The tile resolution.
 * @param {ResampleMethod} resampleMethod The resampling method.
 * @param {number} fillValue The fill value.
 * @return {Float32Array} The tile data.
 */
function composeData(
  chunks,
  chunkResolutions,
  tileColCount,
  tileRowCount,
  tileResolution,
  resampleMethod,
  fillValue,
) {
  const bandCount = chunks.length;
  const tileData = new Float32Array(tileColCount * tileRowCount * bandCount);
  for (let tileRow = 0; tileRow < tileRowCount; tileRow++) {
    for (let tileCol = 0; tileCol < tileColCount; tileCol++) {
      for (let band = 0; band < bandCount; ++band) {
        const chunk = chunks[band];
        const chunkRowCount = chunk.shape[0];
        const chunkColCount = chunk.shape[1];
        const scaleFactor = tileResolution / chunkResolutions[band];
        let value = fillValue;
        if (scaleFactor === 1) {
          if (tileRow < chunkRowCount && tileCol < chunkColCount) {
            value = chunk.data[tileRow * chunkColCount + tileCol];
          }
        } else {
          const chunkRow = tileRow * scaleFactor;
          const chunkCol = tileCol * scaleFactor;
          switch (resampleMethod) {
            case 'nearest': {
              const valueRow = Math.round(chunkRow);
              const valueCol = Math.round(chunkCol);
              if (valueRow < chunkRowCount && valueCol < chunkColCount) {
                value = chunk.data[valueRow * chunkColCount + valueCol];
              }
              break;
            }
            case 'linear': {
              const row0 = Math.floor(chunkRow);
              const col0 = Math.floor(chunkCol);
              if (row0 < chunkRowCount && col0 < chunkColCount) {
                const row1 = Math.min(row0 + 1, chunkRowCount - 1);
                const col1 = Math.min(col0 + 1, chunkColCount - 1);

                const v00 = chunk.data[row0 * chunkColCount + col0];
                const v01 = chunk.data[row0 * chunkColCount + col1];
                const v10 = chunk.data[row1 * chunkColCount + col0];
                const v11 = chunk.data[row1 * chunkColCount + col1];

                const dx = chunkCol - col0;
                const dy = chunkRow - row0;

                value =
                  (1 - dy) * ((1 - dx) * v00 + dx * v01) +
                  dy * ((1 - dx) * v10 + dx * v11);
              }
              break;
            }
            default: {
              throw new Error(`Unsupported resample method: ${resampleMethod}`);
            }
          }
        }
        if (isNaN(value)) {
          value = fillValue;
        }
        tileData[bandCount * (tileRow * tileColCount + tileCol) + band] = value;
      }
    }
  }
  return tileData;
}
