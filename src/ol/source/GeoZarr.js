/**
 * @module ol/source/GeoZarr
 */

import {FetchStore, get, open, slice} from 'zarrita';
import {warn} from '../console.js';
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
 * @typedef {Object} Band
 * @property {string} name The band name.
 * @property {string} group The group path relative to the `url`, containing this band
 * (e.g. `'measurements/reflectance'`).
 */

/**
 * @typedef {Object} Options
 * @property {string} url When `bands` contains plain strings, this must be the full URL to the
 * multiscales group (e.g. `'https://example.com/store.zarr/measurements/reflectance'`).
 * When `bands` contains {@link Band} objects, this is the base URL from which each band's
 * `group` path is resolved (e.g. `'https://example.com/store.zarr/satellite/sentinel2'`).
 * @property {Array<string|Band>} bands The bands to render.  Each entry is either a band name
 * string (single-group mode) or a {@link Band} object specifying both the band name and the
 * group it belongs to (multi-group mode).  In multi-group mode, the first band's group
 * determines the tile grid and must follow at least the proj: and spatial: conventions.
 * If it also has a multiscales layout (all three conventions), multiple resolution levels are
 * supported.  Otherwise a single-resolution tile grid is derived from `spatial:bbox`,
 * `proj:code`, and `spatial:shape` (or the array shape from consolidated metadata).
 * Bands from additional groups do not need to follow any convention; they can be multi-scale
 * (array located at `<matrixId>/<bandName>`) or single-scale (array at the group root).
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.  If not provided, the GeoZarr metadata
 * will be read for projection information.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 * @property {ResampleMethod} [resample='nearest'] Resampling method if bands are not available for all multi-scale levels.
 */

/**
 * Source for GeoZarr stores conforming to the following conventions:
 * - [Zarr multiscales convention](https://github.com/zarr-conventions/multiscales)
 * - [Geospatial projection convention](https://github.com/zarr-conventions/geo-proj)
 * - [Spatial convention](https://github.com/zarr-conventions/spatial)
 *
 * When all three conventions are present, multiple resolution levels are supported.
 * When only proj: and spatial: are present, a single-resolution tile grid is derived
 * from `spatial:bbox`, `proj:code`, and `spatial:shape`.
 * The legacy `tile_matrix_set` attribute is also supported.
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
     * @type {Array<import('zarrita').Group<any>>}
     * @private
     */
    this.groups_ = [];

    /**
     * @type {any|null}
     * @private
     */
    this.consolidatedMetadata_ = null;

    /**
     * Cache of opened zarrita arrays keyed by path. Caching the Promise
     * (not the resolved value) deduplicates concurrent opens for the same
     * array path across tiles at the same zoom level.
     * @private
     * @type {Map<string, Promise<import('zarrita').Array<import('zarrita').DataType, any>>>}
     */
    this.arrayCache_ = new Map();

    const groupOrder = /** @type {Array<string>} */ ([]);
    const bandGroupIndex = /** @type {Array<number>} */ ([]);
    const bands = options.bands.map((b) => {
      if (typeof b === 'string') {
        bandGroupIndex.push(0);
        return b;
      }
      let gi = groupOrder.indexOf(b.group);
      if (gi === -1) {
        gi = groupOrder.length;
        groupOrder.push(b.group);
      }
      bandGroupIndex.push(gi);
      return b.name;
    });

    /**
     * @type {Array<string>|undefined}
     * @private
     */
    this.groupPaths_ = groupOrder.length > 0 ? groupOrder : undefined;

    /**
     * Maps each band index to the index of the group it belongs to in `this.groups_`.
     * @type {Array<number>}
     * @private
     */
    this.bandGroupIndex_ = bandGroupIndex;

    /**
     * Pixel resolution for single-scale bands.  When set, indicates that the
     * band lives directly at its group root (no matrixId subdirectory) and
     * provides the pixel resolution to use for coordinate calculations.
     * Undefined for multi-scale bands.
     * @type {Array<number|undefined>}
     * @private
     */
    this.bandSingleScaleResolution_ = new Array(bands.length).fill(undefined);

    /**
     * @type {Array<string>}
     * @private
     */
    this.bands_ = bands;

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
     * Number of bands.
     * @type {number}
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

    const groupPromises = [];
    if (this.groupPaths_) {
      // Multi-group mode: open root, then each sub-group
      const rootGroup = await open(cachedStore, {kind: 'group'});
      for (const groupPath of this.groupPaths_) {
        groupPromises.push(open(rootGroup.resolve(groupPath), {kind: 'group'}));
      }
    } else {
      // Single group mode
      groupPromises.push(open(cachedStore, {kind: 'group'}));
    }
    this.groups_.push(...(await Promise.all(groupPromises)));

    const attributes =
      /** @type {LegacyDatasetAttributes | DatasetAttributes} */ (
        this.groups_[0].attrs
      );

    // For multi-group mode, use sub-metadata for the first group so that
    // consolidated metadata keys match the expected relative paths.
    const consolidatedMetadata =
      this.groupPaths_ && this.consolidatedMetadata_
        ? getSubMetadata(this.consolidatedMetadata_, this.groupPaths_[0])
        : this.consolidatedMetadata_;

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
          consolidatedMetadata,
          this.bands_,
        );
      this.bandsByLevel_ = bandsByLevel;
      this.tileGrid = tileGrid;
      this.projection = projection;
      this.fillValue_ = fillValue;
      hasTileSizes = !!tileSizes;
    }
    if (
      !hasTileSizes &&
      attributes.multiscales &&
      'tile_matrix_set' in attributes.multiscales
    ) {
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
    if (!this.tileGrid && 'spatial:bbox' in attributes) {
      // Standalone single-scale group: build tile grid directly from
      // spatial:bbox and spatial:shape (or the array shape from metadata).
      let shape = attributes['spatial:shape'];
      if (!shape && consolidatedMetadata) {
        for (const band of this.bands_) {
          if (consolidatedMetadata[band]?.shape) {
            shape = consolidatedMetadata[band].shape;
            break;
          }
        }
      }
      if (shape) {
        const extent = attributes['spatial:bbox'];
        const resolution = (extent[2] - extent[0]) / shape[1];
        if (!this.projection) {
          this.projection = getProjection(attributes['proj:code']);
        }
        if (consolidatedMetadata) {
          this.bandsByLevel_ = {level0: []};
          for (const band of this.bands_) {
            if (consolidatedMetadata[band]) {
              this.bandsByLevel_['level0'].push(band);
              if (this.fillValue_ === undefined) {
                this.fillValue_ = Number(
                  consolidatedMetadata[band]['fill_value'],
                );
              }
            }
          }
        }
        this.tileGrid = new WMTSTileGrid({
          extent: extent,
          origins: [[extent[0], extent[3]]],
          resolutions: [resolution],
          matrixIds: ['level0'],
        });
        for (let i = 0; i < this.bands_.length; ++i) {
          if (this.bandGroupIndex_[i] === 0) {
            this.bandSingleScaleResolution_[i] = resolution;
          }
        }
      }
    }
    // For multi-group: determine which group owns each band and supplement
    // bandsByLevel with bands from additional groups.
    if (this.groupPaths_ && this.consolidatedMetadata_ && this.bandsByLevel_) {
      this.resolveBandOwnership_();
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
    for (let i = 0, ii = this.bands_.length; i < ii; ++i) {
      const band = this.bands_[i];
      const groupIndex = this.bandGroupIndex_[i];
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

      const isSingleScale = this.bandSingleScaleResolution_[i] !== undefined;
      // For single-scale bands, use the band's own pixel resolution (derived
      // from array shape or spatial metadata) rather than the tile grid level
      // resolution, which may give wrong pixel coordinates.
      if (isSingleScale) {
        bandResolution = this.bandSingleScaleResolution_[i];
      }

      const origin = this.tileGrid.getOrigin(bandZ);
      const minCol = Math.round((tileExtent[0] - origin[0]) / bandResolution);
      const maxCol = Math.round((tileExtent[2] - origin[0]) / bandResolution);
      const minRow = Math.round((origin[1] - tileExtent[3]) / bandResolution);
      const maxRow = Math.round((origin[1] - tileExtent[1]) / bandResolution);

      bandInfos.push({
        path: isSingleScale ? band : `${bandMatrixId}/${band}`,
        groupIndex,
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
        const cacheKey = `${info.groupIndex}:${info.path}`;
        if (!this.arrayCache_.has(cacheKey)) {
          this.arrayCache_.set(
            cacheKey,
            open(this.groups_[info.groupIndex].resolve(info.path), {
              kind: 'array',
            }).catch((err) => {
              this.arrayCache_.delete(cacheKey);
              throw err;
            }),
          );
        }
        return this.arrayCache_.get(cacheKey);
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

  /**
   * For multi-group mode: determine which group owns each band and supplement
   * bandsByLevel with bands from additional groups.
   * @private
   */
  resolveBandOwnership_() {
    const subMetadatas = this.groupPaths_.map((gp) =>
      getSubMetadata(this.consolidatedMetadata_, gp),
    );

    for (let i = 0, ii = this.bands_.length; i < ii; ++i) {
      const band = this.bands_[i];
      const g = this.bandGroupIndex_[i];
      if (g === 0) {
        continue; // primary group bands are already in bandsByLevel_
      }
      let foundAtAnyLevel = false;
      for (const matrixId of Object.keys(this.bandsByLevel_)) {
        const bandMeta = subMetadatas[g][`${matrixId}/${band}`];
        if (bandMeta) {
          foundAtAnyLevel = true;
          if (!this.bandsByLevel_[matrixId].includes(band)) {
            this.bandsByLevel_[matrixId].push(band);
          }
          if (this.fillValue_ === undefined) {
            this.fillValue_ = Number(bandMeta['fill_value']);
          }
        }
      }
      if (!foundAtAnyLevel) {
        // Try single-scale: band lives directly at the group root (no matrixId prefix).
        const bandMeta = subMetadatas[g][band];
        if (bandMeta) {
          for (const matrixId of Object.keys(this.bandsByLevel_)) {
            if (!this.bandsByLevel_[matrixId].includes(band)) {
              this.bandsByLevel_[matrixId].push(band);
            }
          }
          if (this.fillValue_ === undefined) {
            this.fillValue_ = Number(bandMeta['fill_value']);
          }
          // Derive the band's actual pixel resolution from its array shape so
          // that loadTile_ can use correct coordinates regardless of the tile
          // grid zoom level.
          const shape = bandMeta['shape'];
          if (shape && shape[1] > 0) {
            const extent = this.tileGrid.getExtent();
            this.bandSingleScaleResolution_[i] =
              (extent[2] - extent[0]) / shape[1];
          }
          foundAtAnyLevel = true;
        }
      }
      if (!foundAtAnyLevel) {
        warn(
          `Band "${band}" from group "${this.groupPaths_[g]}" is not available at any ` +
            `resolution level compatible with the tile grid.`,
        );
      }
    }
  }
}

/**
 * Extract a sub-view of consolidated metadata for a specific group path.
 * Keys in the returned object are relative to the group path.
 * @param {Object} rootMetadata The root consolidated metadata.
 * @param {string} groupPath The group path (e.g. 'measurements/reflectance').
 * @return {Object} Sub-metadata with paths relative to the group.
 */
function getSubMetadata(rootMetadata, groupPath) {
  const prefix = groupPath + '/';
  const sub = {};
  for (const key of Object.keys(rootMetadata)) {
    if (key.startsWith(prefix)) {
      sub[key.substring(prefix.length)] = rootMetadata[key];
    }
  }
  return sub;
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

/***
 * @typedef {{
 *   multiscales: Multiscales,
 *   zarr_conventions: Array<{uuid: string}>,
 *   'spatial:bbox': import("../extent.js").Extent,
 *   'spatial:shape': Array<number>,
 *   'proj:code': string,
 * }} DatasetAttributes
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
  const extentWidth = extent[2] - extent[0];
  const origin = [extent[0], extent[3]];
  /** @type {Array<{matrixId: string, resolution: number, origin: import("../coordinate.js").Coordinate, tileSize: import("../size.js").Size|undefined}>} */
  const groupInfo = [];
  const bandsByLevel = consolidatedMetadata ? {} : null;
  let fillValue;
  for (const groupMetadata of multiscales.layout) {
    const matrixId = groupMetadata.asset;
    const resolution = extentWidth / groupMetadata['spatial:shape'][1];
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
