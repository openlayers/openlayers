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
 * @property {string} url The Zarr URL including the multiscales group path (e.g. `'https://example.com/store.zarr/measurements/reflectance'`).
 * @property {Array<string>} bands The band names to render.
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.  If not provided, the GeoZarr metadata
 * will be read for projection information.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 * @property {ResampleMethod} [resample='nearest'] Resamplilng method if bands are not available for all multi-scale levels.
 */

/**
 * Source that supports GeoZarr stores with metadata for the following conventions:
 * - Zarr multiscales convention (https://github.com/zarr-conventions/multiscales)
 * - Geospatial projection convention (https://github.com/zarr-conventions/geo-proj)
 * - Spatial convention (https://github.com/zarr-conventions/spatial)
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
     * @private
     */
    this.url_ = options.url;

    /**
     * @type {Error|null}
     */
    this.error_ = null;

    /**
     * @type {import('zarrita').Group<any>}
     * @private
     */
    this.group_ = null;

    /**
     * @type {any|null}
     * @private
     */
    this.consolidatedMetadata_ = null;

    /**
     * Cache of opened zarrita arrays keyed by path. Caching the Promise
     * (not the resolved value) deduplicates concurrent opens for the same
     * array path across tiles at the same zoom level.
     * @type {Map<string, Promise<import('zarrita').Array<import('zarrita').DataType, any>>>}
     * @private
     */
    this.arrayCache_ = new Map();

    /**
     * @type {Array<string>}
     * @private
     */
    this.bands_ = options.bands;

    /**
     * @type {Object<string, Array<string>> | null}
     * @private
     */
    this.bandsByLevel_ = null;

    /**
     * @type {number|undefined}
     * @private
     */
    this.fillValue_;

    /**
     * @type {ResampleMethod}
     * @private
     */
    this.resampleMethod_ = options.resample || 'linear';

    /**
     * @type {number} Number of bands.
     */
    this.bandCount = this.bands_.length;

    /**
     * @type {import("../tilegrid/WMTS.js").default}
     * @override
     */
    this.tileGrid;

    this.setLoader(this.loadTile_.bind(this));

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

    // Fetch group zarr.json once for both opening the group and extracting
    // consolidated metadata. Without this, open() and the manual metadata
    // read would each make a separate HTTP request for the same file.
    const groupBytes = await store.get('/zarr.json');
    if (groupBytes) {
      try {
        this.consolidatedMetadata_ = JSON.parse(
          new TextDecoder().decode(groupBytes),
        ).consolidated_metadata.metadata;
      } catch {
        // no consolidated metadata
      }
    }

    // Wrap the store so that child metadata (groups, arrays) is served from
    // the consolidated metadata instead of making per-child HTTP requests.
    const cachedStore = this.consolidatedMetadata_
      ? createCachedStore(store, groupBytes, this.consolidatedMetadata_)
      : store;

    this.group_ = await open(cachedStore, {kind: 'group'});

    const attributes =
      /** @type {LegacyDatasetAttributes | DatasetAttributes} */ (
        this.group_.attrs
      );

    let hasTileSizes = false;
    if (
      'zarr_conventions' in attributes &&
      Array.isArray(attributes.zarr_conventions) &&
      REQUIRED_ZARR_CONVENTIONS.every((uuid) =>
        attributes.zarr_conventions.find((c) => c.uuid === uuid),
      ) &&
      'layout' in attributes.multiscales
    ) {
      const {tileGrid, projection, bandsByLevel, fillValue, tileSizes} =
        getTileGridInfoFromAttributes(
          /** @type {DatasetAttributes} */ (attributes),
          this.consolidatedMetadata_,
          this.bands_,
        );
      this.bandsByLevel_ = bandsByLevel;
      this.tileGrid = tileGrid;
      this.projection = projection;
      this.fillValue_ = fillValue;
      hasTileSizes = !!tileSizes;
    }
    if (!hasTileSizes && 'tile_matrix_set' in attributes.multiscales) {
      // If available, use tile_matrix_set (legacy attributes) to get a tile grid, because it
      // should provide a better mapping of tiles to zarr chunks.
      const {tileGrid, projection} = getTileGridInfoFromLegacyAttributes(
        /** @type {LegacyDatasetAttributes} */ (attributes),
      );
      this.tileGrid = tileGrid;
      if (!this.projection) {
        // If there were no required zarr conventions, we don't have a projection yet
        this.projection = projection;
      }
    }
    if (this.fillValue_ !== null && this.fillValue_ !== undefined) {
      this.bandCount = this.bands_.length + 1;
      this.nodataBandIndex = this.bandCount;
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

    // First pass: resolve band metadata (no async)
    const bandInfos = [];
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

      bandInfos.push({
        path: `${bandMatrixId}/${band}`,
        minRow,
        maxRow,
        minCol,
        maxCol,
        bandResolution,
      });
    }

    // Open all band arrays in parallel (not sequentially)
    const arrays = await Promise.all(
      bandInfos.map((info) => {
        const path = info.path;
        if (!this.arrayCache_.has(path)) {
          this.arrayCache_.set(
            path,
            open(this.group_.resolve(path), {kind: 'array'}).catch((err) => {
              this.arrayCache_.delete(path);
              throw err;
            }),
          );
        }
        return this.arrayCache_.get(path);
      }),
    );

    // Fire all get() calls synchronously so getRange() calls from all bands
    // land in the same macrotask tick and can be batched together.
    const bandResolutions = bandInfos.map((info) => info.bandResolution);
    const bandChunks = await Promise.all(
      arrays.map((array, i) => {
        const info = bandInfos[i];
        return get(array, [
          slice(info.minRow, info.maxRow),
          slice(info.minCol, info.maxCol),
        ]);
      }),
    );
    const [tileColCount, tileRowCount] = toSize(this.tileGrid.getTileSize(z));
    return composeData(
      bandChunks,
      bandResolutions,
      tileColCount,
      tileRowCount,
      tileResolution,
      this.resampleMethod_,
      this.fillValue_,
    );
  }
}

/**
 * Create a store wrapper that serves Zarr v3 metadata from consolidated
 * metadata, avoiding per-child HTTP requests.
 * @param {import('zarrita').FetchStore} store The underlying store.
 * @param {Uint8Array} groupBytes The already-fetched group zarr.json bytes.
 * @param {Object} consolidatedMetadata The parsed consolidated_metadata.metadata entries.
 * @return {Object} A store-compatible object.
 */
function createCachedStore(store, groupBytes, consolidatedMetadata) {
  const cache = new Map();
  cache.set('/zarr.json', groupBytes);
  const encoder = new TextEncoder();
  for (const [key, value] of Object.entries(consolidatedMetadata)) {
    cache.set(`/${key}/zarr.json`, encoder.encode(JSON.stringify(value)));
  }
  return {
    async get(key, opts) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      return store.get(key, opts);
    },
    getRange: store.getRange?.bind(store),
  };
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
 * @property {Array<import("../size.js").Size>|undefined} [tileSizes] The tile sizes for each level, if available.
 */

/**
 * Maximum tile size for rendering.
 * @type {number}
 */
const MAX_TILE_SIZE = 512;

/**
 * Minimum tile size when sharding is used.
 * @type {number}
 */
const MIN_TILE_SIZE = 64;

/**
 * @typedef {Object} ShardInfo
 * @property {Array<number>} shardShape The shard (outer chunk) shape [rows, cols].
 * @property {Array<number>} innerChunkShape The inner chunk shape [rows, cols].
 */

/**
 * FIXME Remove this when GeoZarr datasets provide correct TileMatrixSet info or similar.
 *
 * Get the shard and inner chunk shapes from the Zarr v3 array metadata.
 * Only returns info when a `sharding_indexed` codec is present, meaning
 * `chunk_grid.configuration.chunk_shape` represents the shard (outer chunk) size.
 * @param {Object} arrayMeta The Zarr v3 array metadata from consolidated metadata.
 * @return {ShardInfo|undefined} The shard info, or undefined.
 */
function getShardInfo(arrayMeta) {
  const chunkGrid = arrayMeta['chunk_grid'];
  if (!chunkGrid || chunkGrid['name'] !== 'regular') {
    return undefined;
  }
  const codecs = arrayMeta['codecs'];
  if (!Array.isArray(codecs)) {
    return undefined;
  }
  const shardingCodec = codecs.find((c) => c['name'] === 'sharding_indexed');
  if (!shardingCodec) {
    return undefined;
  }
  return {
    shardShape: chunkGrid['configuration']['chunk_shape'],
    innerChunkShape: shardingCodec['configuration']['chunk_shape'],
  };
}

/**
 * FIXME Remove this when GeoZarr datasets provide correct TileMatrixSet info or similar.
 *
 * Compute a tile size that is a multiple of the inner chunk size, evenly divides
 * the shard size, is at most MAX_TILE_SIZE, and is at least MIN_TILE_SIZE.
 * Aligning with inner chunk boundaries avoids fetching the same inner chunk
 * data for adjacent tiles.
 * @param {number} shardSize The shard size in pixels along one dimension.
 * @param {number} innerChunkSize The inner chunk size in pixels along one dimension.
 * @return {number} The tile size.
 */
function getTileSizeForShard(shardSize, innerChunkSize) {
  // Find the largest multiple of innerChunkSize that divides shardSize
  // and is within [MIN_TILE_SIZE, MAX_TILE_SIZE].
  const maxChunks = Math.floor(MAX_TILE_SIZE / innerChunkSize);
  for (let n = maxChunks; n >= 1; --n) {
    const candidate = n * innerChunkSize;
    if (candidate >= MIN_TILE_SIZE && shardSize % candidate === 0) {
      return candidate;
    }
  }
  // No ideal size found. Use shard size itself when it fits, otherwise
  // use the largest chunk-aligned size that fits within MAX_TILE_SIZE.
  if (shardSize <= MAX_TILE_SIZE && shardSize >= MIN_TILE_SIZE) {
    return shardSize;
  }
  if (shardSize < MIN_TILE_SIZE) {
    return MIN_TILE_SIZE;
  }
  return Math.max(maxChunks * innerChunkSize, MIN_TILE_SIZE);
}

/**
 * @param {DatasetAttributes} attributes The dataset attributes.
 * @param {any} consolidatedMetadata The consolidated metadata.
 * @param {Array<string>} wantedBands The wanted bands.
 * @return {TileGridInfo} The tile grid info.
 */
function getTileGridInfoFromAttributes(
  attributes,
  consolidatedMetadata,
  wantedBands,
) {
  const multiscales = attributes.multiscales;
  const extent = attributes['spatial:bbox'];
  const projection = getProjection(attributes['proj:code']);
  /** @type {Array<{matrixId: string, resolution: number, origin: import("../coordinate.js").Coordinate, tileSize: import("../size.js").Size|undefined}>} */
  const groupInfo = [];
  const bandsByLevel = consolidatedMetadata ? {} : null;
  let fillValue;
  for (const groupMetadata of multiscales.layout) {
    //TODO Handle the complete transform (rotation and different x/y resolutions)
    const transform = groupMetadata['spatial:transform'];
    const resolution = transform[0];
    const origin = [transform[2], transform[5]];
    const matrixId = groupMetadata.asset;
    /** @type {import("../size.js").Size|undefined} */
    let tileSize;
    if (consolidatedMetadata) {
      const availableBands = [];
      for (const band of wantedBands) {
        const bandArray = consolidatedMetadata[`${matrixId}/${band}`];
        if (bandArray) {
          availableBands.push(band);
          if (fillValue === undefined) {
            fillValue = Number(bandArray['fill_value']);
          }
          //FIXME Remove this when GeoZarr datasets provide correct TileMatrixSet info or similar
          if (!tileSize) {
            const shardInfo = getShardInfo(bandArray);
            if (shardInfo) {
              tileSize = [
                getTileSizeForShard(
                  shardInfo.shardShape[1],
                  shardInfo.innerChunkShape[1],
                ),
                getTileSizeForShard(
                  shardInfo.shardShape[0],
                  shardInfo.innerChunkShape[0],
                ),
              ];
            }
          }
        }
      }
      bandsByLevel[matrixId] = availableBands;
    }
    groupInfo.push({
      matrixId,
      resolution,
      origin,
      tileSize,
    });
  }
  groupInfo.sort((a, b) => b.resolution - a.resolution);

  const tileSizes = groupInfo.map((g) => g.tileSize);
  const hasTileSizes = tileSizes.some((s) => s !== undefined);

  const tileGrid = new WMTSTileGrid({
    extent: extent,
    origins: groupInfo.map((g) => g.origin),
    resolutions: groupInfo.map((g) => g.resolution),
    matrixIds: groupInfo.map((g) => g.matrixId),
    ...(hasTileSizes ? {tileSizes: tileSizes.map((s) => s || [256, 256])} : {}),
  });

  return {tileGrid, projection, bandsByLevel, fillValue, tileSizes};
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
  const chunkCount = chunks.length;
  const addAlpha = fillValue !== null && fillValue !== undefined;
  const isNoDataValue = isNaN(fillValue)
    ? (v) => isNaN(v)
    : (v) => v === fillValue;
  const bandCount = chunkCount + (addAlpha ? 1 : 0);
  const tileData = new Float32Array(tileColCount * tileRowCount * bandCount);
  for (let tileRow = 0; tileRow < tileRowCount; tileRow++) {
    for (let tileCol = 0; tileCol < tileColCount; tileCol++) {
      let hasData = false;
      for (let chunkIndex = 0; chunkIndex < chunkCount; ++chunkIndex) {
        const chunk = chunks[chunkIndex];
        const chunkRowCount = chunk.shape[0];
        const chunkColCount = chunk.shape[1];
        const scaleFactor = tileResolution / chunkResolutions[chunkIndex];
        let value = 0;
        let inBounds = false;
        if (scaleFactor === 1) {
          if (tileRow < chunkRowCount && tileCol < chunkColCount) {
            inBounds = true;
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
                inBounds = true;
                value = chunk.data[valueRow * chunkColCount + valueCol];
              }
              break;
            }
            case 'linear': {
              const row0 = Math.floor(chunkRow);
              const col0 = Math.floor(chunkCol);
              if (row0 < chunkRowCount && col0 < chunkColCount) {
                inBounds = true;
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
        if (inBounds && !isNoDataValue(value)) {
          hasData = true;
        }
        if (isNaN(value)) {
          value = 0;
        }
        tileData[bandCount * (tileRow * tileColCount + tileCol) + chunkIndex] =
          value;
      }
      if (addAlpha) {
        tileData[bandCount * (tileRow * tileColCount + tileCol) + chunkCount] =
          hasData ? 1 : 0;
      }
    }
  }
  return tileData;
}
