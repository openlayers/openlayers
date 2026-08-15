/**
 * @module ol/source/GeoZarr
 */

import {
  FetchStore,
  NotFoundError,
  get,
  open,
  slice,
  withRangeCoalescing,
} from 'zarrita';
import {warn} from '../console.js';
import {getCenter} from '../extent.js';
import {get as getProjection, toUserCoordinate, toUserExtent} from '../proj.js';
import {fromProjectionDefinition} from '../proj/proj4.js';
import {toSize} from '../size.js';
import WMTSTileGrid from '../tilegrid/WMTS.js';
import {DEFAULT_TILE_SIZE} from '../tilegrid/common.js';
import {getUid} from '../util.js';
import DataTileSource from './DataTile.js';
import {parseTileMatrixSet} from './ogcTileUtil.js';

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
 * @typedef {Object} GeoZarrStoreOptions
 * @property {Object<string, string>} [headers] additional key-value pairs of headers to be passed with each request. Key is the header name, value the header value.
 * @property {string} [credentials] How credentials shall be handled. See
 * https://developer.mozilla.org/en-US/docs/Web/API/fetch for reference and possible values
 */

/**
 * @typedef {Object} Options
 * @property {string} url When `bands` contains plain strings, this must be the full URL to the
 * multiscales group (e.g. `'https://example.com/store.zarr/measurements/reflectance'`).
 * When `bands` contains {@link Band} objects, this is the base URL from which each band's
 * `group` path is resolved (e.g. `'https://example.com/store.zarr/satellite/sentinel2'`).
 * @property {Array<string|Band>} [bands] The bands to render, for stores where each
 * band is a separate array. Mutually exclusive with `variable`.  Each entry is either a band name
 * string (single-group mode) or a {@link Band} object specifying both the band name and the
 * group it belongs to (multi-group mode).  In multi-group mode, the first band's group
 * determines the tile grid and must follow at least the proj: and spatial: conventions.
 * If it also has a multiscales layout (all three conventions), multiple resolution levels are
 * supported.  Otherwise a single-resolution tile grid is derived from `spatial:bbox`,
 * `proj:code`, and `spatial:shape` (or the array shape from consolidated metadata).
 * Bands from additional groups do not need to follow any convention; they can be multi-scale
 * (array located at `<matrixId>/<bandName>`) or single-scale (array at the group root).
 * @property {GeoZarrStoreOptions} [storeOptions] Additional options to be passed to
 * [zarrita](https://zarrita.dev/)'s `FetchStore` with each request to the Zarr store.
 * @property {import("../proj.js").ProjectionLike} [projection] Source projection.
 * If not provided, the GeoZarr metadata will be read for projection information.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 * @property {ResampleMethod} [resample='linear'] Resampling method if bands are not available for all multi-scale levels.
 * @property {Object<string, number|string|Array<number|string>>} [dimensions] How to slice
 * each non-spatial dimension of the band arrays, keyed by dimension name (e.g. `{time: 0}` for
 * the first time step of a `[time, y, x]` cube). Values are 0-based indices (number) or
 * coordinate labels (string); unlisted dimensions default to index 0. Names come from each
 * array's `dimension_names`, or are the axis position as a string when it has none; use the
 * names from {@link getDimensions}. Labels are resolved against the dimension's coordinate
 * array; if that array cannot be read, pass indices instead. With `variable`, at most one
 * dimension may map to an array of values, whose entries are rendered as separate bands in
 * the given order. Change the selection on the fly with
 * {@link module:ol/source/GeoZarr~GeoZarr#updateDimensions}.
 * @property {string} [variable] The name of an n-dimensional data array (variable) to
 * render, for stores where all bands are packed into a single array (e.g. a
 * `(time, band, y, x)` datacube). The array must exist within each multiscale level
 * group (or at the group root for single-scale stores). Mutually exclusive with `bands`,
 * and required to select several bands from one dimension through `dimensions`.
 * @property {import("../extent.js").Extent} [extent] Fallback extent of the data, in
 * coordinates of the source projection. Only used when the store neither declares its
 * extent (`spatial:bbox` or `bounds` attributes) nor has coordinate arrays to infer it.
 * @property {boolean} [flipY] Fallback orientation: set to `true` when the data is
 * stored south-up (ascending y). Only used when the orientation can neither be read
 * from the store metadata nor inferred from its coordinate arrays.
 */

/**
 * Source for GeoZarr stores conforming to the following conventions:
 * - [Zarr multiscales convention](https://github.com/zarr-conventions/multiscales)
 * - [Geospatial projection convention](https://github.com/zarr-conventions/geo-proj)
 * - [Spatial convention](https://github.com/zarr-conventions/spatial)
 *
 * The store is read as a stack of resolution levels, enumerated from the
 * `multiscales` attribute in either its `{layout: [{asset, ...}]}` or its
 * `[{datasets: [{path, ...}]}]` form; a store with neither has the group itself as
 * its only level. The legacy `tile_matrix_set` attribute is also supported, and
 * describes the levels itself.
 *
 * Extent, resolution, projection and y-axis orientation are read from the store
 * metadata (`spatial:bbox`, `spatial:shape`, `spatial:transform`, `proj:code`,
 * ...) where declared, and otherwise inferred from the coordinate arrays. The
 * conventions above are what make that metadata available, but none of them has
 * to be declared for a store that provides the attributes.
 *
 * Two data layouts are supported:
 * - One array per band (`bands` option), addressed by name at `<matrixId>/<bandName>`
 *   (multi-scale) or at the group root (single-scale).
 * - A single n-dimensional data array shared by all bands (`variable` + `dimensions`
 *   options), e.g. a `(time, band, y, x)` datacube.
 *
 * Both layouts support Zarr v2 and v3.
 */
export default class GeoZarr extends DataTileSource {
  /**
   * @param {Options} options The options.
   */
  constructor(options) {
    super({
      state: 'loading',
      tileGrid: /** @type {?} */ (null),
      projection: /** @type {import("../proj.js").ProjectionLike} */ (
        options.projection || null
      ),
      transition: options.transition,
      wrapX: options.wrapX,
      hasAlpha: false,
    });

    /**
     * @type {string}
     * @private
     */
    this.url_ = options.url;

    /**
     * @type {GeoZarrStoreOptions|undefined}
     * @private
     */
    this.storeOptions_ = options.storeOptions;

    /**
     * Selection per non-spatial dimension name, from the `dimensions` option.
     * Coordinate labels are replaced by their index once resolved.
     * @type {Object<string, number|string|Array<number|string>>}
     * @private
     */
    this.dimensions_ = options.dimensions || {};

    /**
     * @type {string|undefined}
     * @private
     */
    this.variable_ = options.variable;

    /**
     * @type {import("../extent.js").Extent|undefined}
     * @private
     */
    this.fallbackExtent_ = options.extent;

    /**
     * @type {boolean|undefined}
     * @private
     */
    this.fallbackFlipY_ = options.flipY;

    /**
     * The zarrita open function, pinned to the store's Zarr version by
     * `configure_`. Never the unpinned `open`, which probes v2 metadata first
     * and so requests keys that a v3 store does not have.
     * @type {Function}
     * @private
     */
    this.openFn_ = open.v3;

    /**
     * Group path prefix per tile matrix id, for stores whose levels are not
     * addressed by the matrix id itself (empty string for the group root).
     * `null` when the matrix id is the prefix.
     * @type {Object<string, string>|null}
     * @private
     */
    this.levelPaths_ = null;

    /**
     * Row axis information per tile matrix id, for data with non-square
     * pixels or south-up (flipped) rows.
     * @type {Object<string, {rowResolution: number, shapeY: number|undefined, flip: boolean}>|null}
     * @private
     */
    this.levelRowInfo_ = null;

    /**
     * The axis selected as multiple bands through the `dimensions` option,
     * or -1.
     * @type {number}
     * @private
     */
    this.multiAxis_ = -1;

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
     * @type {Object<string, *>|null}
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
    const bands = (options.bands || []).map((b) => {
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
     * Per-band selection along non-spatial dimensions: `undefined` for 2-D
     * arrays, otherwise an array aligned to the array rank with a fixed integer
     * at each extra axis and `null` at the two spatial axes (e.g. `[2, null,
     * null]` for a `[time, y, x]` array with `time: 2`).
     * @type {Array<Array<number|null>|undefined>}
     * @private
     */
    this.bandExtraSelection_ = new Array(bands.length).fill(undefined);

    /**
     * Per-band spatial (y, x) axis positions, as `{row, col}`.
     * @type {Array<{row: number, col: number}>}
     * @private
     */
    this.bandSpatialAxes_ = new Array(bands.length);

    /**
     * The two spatial axis names from the group's `spatial:dimensions` (`[y, x]`).
     * @type {Array<string>|undefined}
     * @private
     */
    this.spatialDimensionNames_;

    /**
     * Non-spatial dimensions of the bands, exposed via {@link getDimensions}.
     * @type {Array<{name: string, size: number}>}
     * @private
     */
    this.extraDimensions_ = [];

    /**
     * @type {Object<string, Array<string>>|null|undefined}
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
    this.bandCount = this.variable_ ? 1 : this.bands_.length;
    // A dimension listing several values renders one band per value. Only
    // `variable` can do that, since `bands` names one array per band.
    let multiName;
    for (const name in this.dimensions_) {
      const value = this.dimensions_[name];
      if (!Array.isArray(value)) {
        continue;
      }
      if (!this.variable_) {
        throw new Error(
          `GeoZarr: dimension "${name}" selects several bands, which requires ` +
            'the `variable` option.',
        );
      }
      if (multiName) {
        throw new Error(
          `GeoZarr: dimensions "${multiName}" and "${name}" both select ` +
            'several bands; at most one may.',
        );
      }
      multiName = name;
      this.bandCount = value.length;
    }

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
        // A 403 reads as a missing key, so the two causes are indistinguishable.
        this.error_ =
          err instanceof NotFoundError
            ? new Error(
                `GeoZarr: could not read ${this.url_}; it is missing, or ` +
                  `access to it is denied.`,
                {cause: err},
              )
            : err;
        this.setState('error');
      });
  }

  async configure_() {
    const overrides = /** @type {RequestInit} */ (this.storeOptions_) || {};
    const store = /** @type {FetchStore} */ (
      withRangeCoalescing(
        new FetchStore(this.url_, {overrides, fetch: storeFetch}),
      )
    );

    // Fetch group zarr.json once for opening the group, extracting consolidated
    // metadata, and pinning the detected Zarr version.
    const groupBytes = await probe(store, '/zarr.json');
    this.openFn_ = groupBytes ? open.v3 : open.v2;
    if (groupBytes) {
      try {
        this.consolidatedMetadata_ = JSON.parse(
          new TextDecoder().decode(groupBytes),
        ).consolidated_metadata.metadata;
      } catch {
        // no consolidated metadata
      }
    }

    /** @type {Object<string, *>|null} */
    let v2Metadata = null;
    if (!groupBytes) {
      // Zarr v2: consolidated metadata lives in .zmetadata
      const v2Bytes = await probe(store, '/.zmetadata');
      if (v2Bytes) {
        try {
          v2Metadata = JSON.parse(new TextDecoder().decode(v2Bytes)).metadata;
          this.consolidatedMetadata_ = normalizeV2Metadata(
            /** @type {Object<string, *>} */ (v2Metadata),
          );
        } catch {
          // no consolidated metadata
        }
      }
    }

    // Wrap the store so that child metadata (groups, arrays) is served from
    // the consolidated metadata instead of making per-child HTTP requests.
    const cachedStore = v2Metadata
      ? createCachedStoreV2(store, v2Metadata)
      : this.consolidatedMetadata_
        ? createCachedStore(
            store,
            /** @type {Uint8Array} */ (groupBytes),
            this.consolidatedMetadata_,
          )
        : withChunkCache(store);

    const groupPromises = [];
    if (this.groupPaths_) {
      // Multi-group mode: open root, then each sub-group
      const rootGroup = await this.openFn_(cachedStore, {kind: 'group'});
      for (const groupPath of this.groupPaths_) {
        groupPromises.push(
          this.openFn_(rootGroup.resolve(groupPath), {kind: 'group'}),
        );
      }
    } else {
      // Single group mode
      groupPromises.push(this.openFn_(cachedStore, {kind: 'group'}));
    }
    this.groups_.push(...(await Promise.all(groupPromises)));

    const attributes =
      /** @type {LegacyDatasetAttributes | DatasetAttributes} */ (
        this.groups_[0].attrs
      );

    // The spatial: convention names the two spatial axes (`[y, x]`), so they can
    // be located by name in each array's `dimension_names`.
    const spatialDimensions =
      'spatial:dimensions' in attributes
        ? /** @type {Array<string>} */ (attributes['spatial:dimensions'])
        : undefined;
    if (Array.isArray(spatialDimensions) && spatialDimensions.length === 2) {
      this.spatialDimensionNames_ = spatialDimensions;
    }

    const multiscales = attributes.multiscales;
    // The two multiscale layouts that enumerate level groups: the GeoZarr
    // `[{datasets: [...]}]` form and the convention's `{layout: [...]}` form.
    const hasMultiscaleLevels =
      Array.isArray(multiscales) ||
      Array.isArray(/** @type {Multiscales} */ (multiscales)?.layout);
    // The legacy tile_matrix_set describes the levels itself, so a store that
    // has nothing else to enumerate them by is configured from it alone.
    const legacyOnly =
      !!multiscales && 'tile_matrix_set' in multiscales && !hasMultiscaleLevels;

    let hasTileSizes = false;
    if (
      this.variable_ ||
      (!legacyOnly &&
        (hasMultiscaleLevels ||
          'spatial:bbox' in attributes ||
          'bounds' in attributes))
    ) {
      hasTileSizes = await this.configureLevels_(attributes, store);
    }
    if (!hasTileSizes && multiscales && 'tile_matrix_set' in multiscales) {
      // If available, use tile_matrix_set (legacy attributes) to get a tile grid, because it
      // should provide a better mapping of tiles to zarr chunks.
      const {tileGrid, projection} = getTileGridInfoFromLegacyAttributes(
        /** @type {LegacyDatasetAttributes} */ (attributes),
      );
      this.tileGrid = tileGrid;
      // The tile matrix set brings its own matrix ids, which the levels
      // resolved above are not keyed by.
      this.bandsByLevel_ = null;
      this.levelPaths_ = null;
      this.levelRowInfo_ = null;
      if (!this.projection) {
        // Only the tile matrix set declares one for a legacy-only store
        this.projection = projection;
      }
    }
    // For multi-group: determine which group owns each band and supplement
    // bandsByLevel with bands from additional groups.
    if (this.groupPaths_ && this.consolidatedMetadata_ && this.bandsByLevel_) {
      this.resolveBandOwnership_();
    }
    if (this.fillValue_ !== null && this.fillValue_ !== undefined) {
      this.bandCount += 1;
      this.nodataBandIndex = this.bandCount;
      this.hasAlpha = true;
    }
    if (!this.tileGrid) {
      throw new Error('Could not determine tile grid');
    }

    // Replace coordinate labels by their index once, so that the per-band
    // resolution below and `updateDimensions` can stay synchronous.
    // (In `variable` mode, configureLevels_ resolves them per band instead.)
    if (!this.variable_) {
      for (const [name, value] of Object.entries(this.dimensions_)) {
        if (typeof value === 'string') {
          this.dimensions_[name] = await this.resolveCoordinateLabel_(
            name,
            value,
            this.coordinateArray_(name)?.path ?? name,
          );
        }
      }
    }

    // Resolve, per band, the spatial axes and the fixed indices for any
    // non-spatial dimensions, and record the selectable dimensions.
    // (In `variable` mode, configureLevels_ resolves these instead.)
    for (let i = 0, ii = this.variable_ ? 0 : this.bands_.length; i < ii; ++i) {
      const arrayMeta = this.getBandArrayMeta_(
        this.bands_[i],
        this.bandGroupIndex_[i],
      );
      const {row, col} = this.axesOf_(arrayMeta);
      this.bandSpatialAxes_[i] = {row, col};
      this.bandExtraSelection_[i] = this.resolveExtraSelection_(
        arrayMeta,
        this.dimensions_,
      );
      if (this.extraDimensions_.length === 0) {
        this.extraDimensions_ = this.extraDimsOf_(arrayMeta);
      }
    }

    const extent = /** @type {import("../extent.js").Extent} */ (
      this.tileGrid.getExtent()
    );
    const projection = /** @type {import("../proj/Projection.js").default} */ (
      this.projection
    );
    setTimeout(() => {
      this.viewResolver?.({
        showFullExtent: true,
        projection: projection,
        resolutions: this.tileGrid.getResolutions(),
        center: toUserCoordinate(getCenter(extent), projection),
        extent: toUserExtent(extent, projection),
        zoom: 1,
      });
    });
  }

  /**
   * @param {number} z The z tile index.
   * @param {number} x The x tile index.
   * @param {number} y The y tile index.
   * @param {import('./DataTile.js').LoaderOptions} options The loader options.
   * @return {Promise<import("../DataTile.js").Data>} The composed tile data.
   * @private
   */
  async loadTile_(z, x, y, options) {
    const resolutions = this.tileGrid.getResolutions();
    const tileResolution = this.tileGrid.getResolution(z);
    const tileExtent = this.tileGrid.getTileCoordExtent([z, x, y]);

    // First pass: resolve band metadata (no async)
    /** @type {Array<{path: string, groupIndex: number, minRow: number, maxRow: number, minCol: number, maxCol: number, bandResolution: number, rowResolution: number, flip: boolean}>} */
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

      if (!bandMatrixId || bandResolution === undefined) {
        throw new Error(`Could not find available resolution for band ${band}`);
      }

      const resolvedBandResolution = bandResolution;

      const isSingleScale = this.bandSingleScaleResolution_[i] !== undefined;
      // For single-scale bands, use the band's own pixel resolution (derived
      // from array shape or spatial metadata) rather than the tile grid level
      // resolution, which may give wrong pixel coordinates.
      if (isSingleScale) {
        bandResolution = this.bandSingleScaleResolution_[i];
      }

      const effectiveResolution = /** @type {number} */ (
        bandResolution ?? resolvedBandResolution
      );

      // Pixels are not necessarily square (e.g. a square array covering the
      // full EPSG:4326 world), and rows may be stored south-up.
      const rowInfo = this.levelRowInfo_?.[bandMatrixId];
      const rowResolution =
        !isSingleScale && rowInfo ? rowInfo.rowResolution : effectiveResolution;
      const flip = !!rowInfo?.flip && rowInfo.shapeY !== undefined;

      // The matrix id addresses the level group, unless the level has its
      // own group path (empty for the group root).
      const levelPath = this.levelPaths_
        ? this.levelPaths_[bandMatrixId]
        : bandMatrixId;

      const origin = this.tileGrid.getOrigin(bandZ);
      const minCol = Math.round(
        (tileExtent[0] - origin[0]) / effectiveResolution,
      );
      const maxCol = Math.round(
        (tileExtent[2] - origin[0]) / effectiveResolution,
      );
      let minRow = Math.round((origin[1] - tileExtent[3]) / rowResolution);
      let maxRow = Math.round((origin[1] - tileExtent[1]) / rowResolution);
      if (flip) {
        // South-up: read the vertically mirrored row range and flip the
        // rows after reading.
        const shapeY = /** @type {number} */ (rowInfo.shapeY);
        [minRow, maxRow] = [
          Math.max(0, shapeY - maxRow),
          Math.max(0, shapeY - minRow),
        ];
      }

      bandInfos.push({
        path: isSingleScale || !levelPath ? band : `${levelPath}/${band}`,
        groupIndex,
        minRow,
        maxRow,
        minCol,
        maxCol,
        bandResolution: effectiveResolution,
        rowResolution,
        flip,
      });
    }

    // Open all band arrays in parallel (not sequentially)
    const arrays = await Promise.all(
      bandInfos.map((info) => this.openArray_(info.groupIndex, info.path)),
    );

    // Fire all get() calls synchronously so getRange() calls from all bands
    // land in the same macrotask tick and can be batched together.
    const bandResolutions = bandInfos.map((info) => info.bandResolution);
    const bandRowResolutions = bandInfos.map((info) => info.rowResolution);
    let bandChunks = await Promise.all(
      arrays.map((array, i) => {
        const info = bandInfos[i];
        const rowSlice = slice(info.minRow, info.maxRow);
        const colSlice = slice(info.minCol, info.maxCol);
        const extra = this.bandExtraSelection_[i];
        if (!extra) {
          return get(array, [rowSlice, colSlice]);
        }
        // Drop the row/column slices in at the spatial axes; zarrita drops the
        // integer axes, returning a 2-D chunk that composeData consumes unchanged.
        const {row, col} = this.bandSpatialAxes_[i];
        /** @type {Array<number|null|ReturnType<typeof slice>>} */
        const selection = extra.slice();
        selection[row] = rowSlice;
        selection[col] = colSlice;
        return get(array, selection);
      }),
    );
    bandChunks = bandChunks.map((chunk, i) =>
      bandInfos[i].flip ? flipChunkRows(chunk) : chunk,
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
      bandRowResolutions,
    );
  }

  /**
   * For multi-group mode: determine which group owns each band and supplement
   * bandsByLevel with bands from additional groups.
   * @private
   */
  resolveBandOwnership_() {
    const bandsByLevel = /** @type {Object<string, Array<string>>} */ (
      this.bandsByLevel_
    );
    const groupPaths = /** @type {Array<string>} */ (this.groupPaths_);
    const subMetadatas = groupPaths.map((gp) =>
      getSubMetadata(
        /** @type {Object<string, *>} */ (this.consolidatedMetadata_),
        gp,
      ),
    );

    for (let i = 0, ii = this.bands_.length; i < ii; ++i) {
      const band = this.bands_[i];
      const g = this.bandGroupIndex_[i];
      if (g === 0) {
        continue; // primary group bands are already in bandsByLevel_
      }
      let foundAtAnyLevel = false;
      for (const matrixId of Object.keys(bandsByLevel)) {
        const bandMeta = /** @type {Object<string, *>|undefined} */ (
          subMetadatas[g][`${matrixId}/${band}`]
        );
        if (bandMeta) {
          foundAtAnyLevel = true;
          if (!bandsByLevel[matrixId].includes(band)) {
            bandsByLevel[matrixId].push(band);
          }
          if (this.fillValue_ === undefined) {
            this.fillValue_ = Number(bandMeta['fill_value']);
          }
        }
      }
      if (!foundAtAnyLevel) {
        // Try single-scale: band lives directly at the group root (no matrixId prefix).
        const bandMeta = /** @type {Object<string, *>|undefined} */ (
          subMetadatas[g][band]
        );
        if (bandMeta) {
          for (const matrixId of Object.keys(bandsByLevel)) {
            if (!bandsByLevel[matrixId].includes(band)) {
              bandsByLevel[matrixId].push(band);
            }
          }
          if (this.fillValue_ === undefined) {
            this.fillValue_ = Number(bandMeta['fill_value']);
          }
          // Derive the band's pixel resolution from its array shape so loadTile_
          // uses correct coordinates regardless of the tile grid zoom level.
          const shape = /** @type {Array<number>|undefined} */ (
            bandMeta['shape']
          );
          const xSize = shape && shape[this.axesOf_(bandMeta).col];
          if (xSize !== undefined && xSize > 0) {
            const tileExtent = /** @type {import("../extent.js").Extent} */ (
              this.tileGrid.getExtent()
            );
            this.bandSingleScaleResolution_[i] =
              (tileExtent[2] - tileExtent[0]) / xSize;
          }
          foundAtAnyLevel = true;
        }
      }
      if (!foundAtAnyLevel) {
        warn(
          `Band "${band}" from group "${this.groupPaths_?.[g]}" is not available at any ` +
            `resolution level compatible with the tile grid.`,
        );
      }
    }
  }

  /**
   * Open a Zarr array (path relative to its group) through the shared cache, so
   * concurrent opens of the same array are deduplicated.
   * @param {number} groupIndex The band's group index.
   * @param {string} path The array path relative to the group.
   * @return {Promise<import('zarrita').Array<import('zarrita').DataType, any>>} The array.
   * @private
   */
  openArray_(groupIndex, path) {
    const cacheKey = `${groupIndex}:${path}`;
    let array = this.arrayCache_.get(cacheKey);
    if (!array) {
      array =
        /** @type {Promise<import('zarrita').Array<import('zarrita').DataType, any>>} */ (
          this.openFn_(this.groups_[groupIndex].resolve(path), {
            kind: 'array',
          })
        ).catch((/** @type {Error} */ err) => {
          this.arrayCache_.delete(cacheKey);
          throw err;
        });
      this.arrayCache_.set(cacheKey, array);
    }
    return array;
  }

  /**
   * Consolidated metadata for a group, with keys relative to that group.
   * @param {number} groupIndex The group index.
   * @return {Object<string, *>} The group's consolidated metadata.
   * @private
   */
  groupMetadata_(groupIndex) {
    return this.groupPaths_
      ? getSubMetadata(
          /** @type {Object<string, *>} */ (this.consolidatedMetadata_),
          this.groupPaths_[groupIndex],
        )
      : /** @type {Object<string, *>} */ (this.consolidatedMetadata_);
  }

  /**
   * Look up a band's Zarr v3 array metadata from consolidated metadata, trying
   * the multi-scale key (`<matrixId>/<band>`) first and falling back to a
   * single-scale key (`<band>`).
   * @param {string} band The band name.
   * @param {number} groupIndex The index of the band's group.
   * @return {Object<string, *>|undefined} The array metadata, or undefined when unavailable.
   * @private
   */
  getBandArrayMeta_(band, groupIndex) {
    if (!this.consolidatedMetadata_) {
      return undefined;
    }
    const meta = this.groupMetadata_(groupIndex);
    if (this.bandsByLevel_) {
      for (const matrixId of Object.keys(this.bandsByLevel_)) {
        if (
          this.bandsByLevel_[matrixId].includes(band) &&
          meta[`${matrixId}/${band}`]
        ) {
          return /** @type {Object<string, *>} */ (meta[`${matrixId}/${band}`]);
        }
      }
    }
    return /** @type {Object<string, *>|undefined} */ (meta[band]);
  }

  /**
   * Locate the 1-D coordinate array for a non-spatial dimension, by name among
   * the group's 1-D arrays.
   * @param {string} name The dimension name.
   * @return {{path: string, groupIndex: number, meta: Object<string, *>}|null} The path
   *     (relative to the group), group index, and array metadata; or `null`.
   * @private
   */
  coordinateArray_(name) {
    if (!this.consolidatedMetadata_) {
      return null;
    }
    const groupIndex = this.bandGroupIndex_[0];
    const meta = this.groupMetadata_(groupIndex);
    const suffix = `/${name}`;
    for (const path of Object.keys(meta)) {
      if (path === name || path.endsWith(suffix)) {
        const arrayMeta = /** @type {Object<string, *>} */ (meta[path]);
        if (Array.isArray(arrayMeta?.shape) && arrayMeta.shape.length === 1) {
          return {path, groupIndex, meta: arrayMeta};
        }
      }
    }
    return null;
  }

  /**
   * Get the non-spatial dimensions of the bands (e.g. `time`) that can be fixed
   * through the `dimensions` option, keyed by dimension name. Each entry has its
   * `size` and the `attributes` of its coordinate array (e.g. `units`, for
   * interpreting the values from {@link getValue}), or `attributes: null` when
   * there is no coordinate array. Resolves with an empty object for 2-D bands,
   * once the source is `ready`; rejects if the source fails to load.
   * @return {Promise<Object<string, {size: number, attributes: Object|null}>>}
   *     The selectable dimensions.
   */
  async getDimensions() {
    await this.ready();
    /** @type {Object<string, {size: number, attributes: Object|null}>} */
    const dimensions = {};
    for (const dimension of this.extraDimensions_) {
      const coord = this.coordinateArray_(dimension.name);
      dimensions[dimension.name] = {
        size: dimension.size,
        attributes: coord ? (coord.meta.attributes ?? null) : null,
      };
    }
    return dimensions;
  }

  /**
   * Read the coordinate value at an index along a non-spatial dimension (e.g.
   * the timestamp for a `time` index), for labeling the current selection. The
   * value is returned raw (as stored, e.g. a `bigint` for a 64-bit integer
   * axis); use the `attributes` from {@link getDimensions} to interpret it.
   * Returns `null` for a dimension without a coordinate array. Available once
   * the source is `ready`.
   * @param {string} name The dimension name (see {@link getDimensions}).
   * @param {number} index The index along the dimension.
   * @return {Promise<number|bigint|null>} The coordinate value, or null.
   */
  async getValue(name, index) {
    await this.ready();
    const coord = this.coordinateArray_(name);
    if (!coord) {
      return null;
    }
    const size = coord.meta.shape[0];
    if (index < 0 || index >= size) {
      throw new Error(
        `GeoZarr: index ${index} out of range for dimension "${name}" (size ${size}).`,
      );
    }
    const array = await this.openArray_(coord.groupIndex, coord.path);
    const chunk = await get(array, [slice(index, index + 1)]);
    return /** @type {number|bigint} */ (
      /** @type {ArrayLike<number|bigint>} */ (chunk.data)[0]
    );
  }

  /**
   * Change the fixed index of one or more non-spatial dimensions (e.g. move to
   * another `time` slice) without rebuilding the source. Values are merged into
   * the current selection, so a partial update like `{time: 3}` leaves the other
   * dimensions untouched. Takes effect immediately when the source is `ready`,
   * otherwise once it becomes ready. Only integer indices are accepted here;
   * coordinate labels are resolved once, when the source configures.
   * @param {Object<string, number>} dimensions Index per dimension name
   *     to change; see the `dimensions` constructor option.
   */
  updateDimensions(dimensions) {
    const merged = {...this.dimensions_, ...dimensions};
    if (this.getState() !== 'ready') {
      // configure_ reads dimensions_ when it resolves; nothing to do yet.
      this.dimensions_ = merged;
      return;
    }
    // Resolve every band before assigning, so an invalid name or index
    // throws without leaving a half-updated selection.
    const selection = this.bands_.map((band, i) => {
      const arrayMeta = this.getBandArrayMeta_(band, this.bandGroupIndex_[i]);
      if (!this.variable_) {
        return this.resolveExtraSelection_(arrayMeta, merged);
      }
      // In `variable` mode, merge into the current selection so the axes
      // fixed through the `dimensions` option are kept.
      const dims = this.extraDimsOf_(arrayMeta);
      const current = this.bandExtraSelection_[i];
      const updated = current ? current.slice() : undefined;
      for (const [name, index] of Object.entries(dimensions)) {
        const dim = dims.find((d) => d.name === name);
        if (!dim || !updated) {
          throw new Error(
            `GeoZarr: unknown dimension "${name}"; ` +
              `available: [${dims.map((d) => d.name).join(', ')}].`,
          );
        }
        if (dim.axis === this.multiAxis_) {
          throw new Error(
            `GeoZarr: dimension "${name}" selects the rendered bands; ` +
              `set it when constructing the source instead.`,
          );
        }
        if (
          typeof index !== 'number' ||
          !Number.isInteger(index) ||
          index < 0 ||
          index >= dim.size
        ) {
          throw new Error(
            `GeoZarr: invalid index ${index} for dimension "${name}" ` +
              `(size ${dim.size}).`,
          );
        }
        updated[dim.axis] = index;
      }
      return updated;
    });
    this.dimensions_ = merged;
    this.bandExtraSelection_ = selection;
    // Bump the tile key to reload tiles. Deriving it from the selection (rather
    // than a counter) keeps prior selections' tiles cached, so revisiting hits.
    this.setKey(getUid(this) + ':' + JSON.stringify(selection));
  }

  /**
   * Locate the spatial (y, x) axes of an array (see {@link getSpatialAxes}) and
   * its remaining non-spatial axes.
   * @param {Object<string, *>|undefined} arrayMeta Zarr v3 array metadata.
   * @return {{row: number, col: number, extra: Array<number>}} The row (y) and
   *     column (x) axis positions and the remaining extra axes, in array order.
   * @private
   */
  axesOf_(arrayMeta) {
    const {row, col} = getSpatialAxes(this.spatialDimensionNames_, arrayMeta);
    const rank = ((arrayMeta && arrayMeta['shape']) || []).length;
    const extra = [];
    for (let axis = 0; axis < rank; ++axis) {
      if (axis !== row && axis !== col) {
        extra.push(axis);
      }
    }
    return {row, col, extra};
  }

  /**
   * Describe the non-spatial dimensions of an array. Each is named by its
   * `dimension_names` entry, or by its axis position when there are none.
   * @param {Object<string, *>|undefined} arrayMeta Zarr v3 array metadata.
   * @return {Array<{name: string, size: number, axis: number}>} The extra dimensions, outermost first.
   * @private
   */
  extraDimsOf_(arrayMeta) {
    if (!arrayMeta) {
      return [];
    }
    const shape = arrayMeta['shape'];
    if (!Array.isArray(shape) || shape.length <= 2) {
      return [];
    }
    const dimensionNames = arrayMeta['dimension_names'];
    const hasNames = Array.isArray(dimensionNames);
    const dims = [];
    for (const axis of this.axesOf_(arrayMeta).extra) {
      const raw = hasNames ? dimensionNames[axis] : undefined;
      const name =
        raw === null || raw === undefined ? String(axis) : String(raw);
      dims.push({name, size: shape[axis], axis});
    }
    return dims;
  }

  /**
   * Resolve the fixed index for each non-spatial dimension of a band array from
   * the `dimensions` option. Returns `undefined` for 2-D arrays, otherwise an
   * array aligned to the array rank with a fixed integer at each extra axis and
   * `null` at the two spatial axes (e.g. `[2, null, null]` for a `[time, y, x]`
   * array with `{time: 2}`).
   * @param {Object<string, *>|undefined} arrayMeta Zarr v3 array metadata.
   * @param {Object<string, number|string|Array<number|string>>} dimensions The
   *     dimension indices to resolve against.
   * @return {Array<number|null>|undefined} The extra-axis selection template.
   * @private
   */
  resolveExtraSelection_(arrayMeta, dimensions) {
    if (!arrayMeta) {
      return undefined;
    }
    const dims = this.extraDimsOf_(arrayMeta);
    if (dims.length === 0) {
      return undefined;
    }
    const names = dims.map((d) => d.name);
    const dimKeys = Object.keys(dimensions);
    // A single unnamed dimension is lenient: any single key binds to it.
    const singleUnnamed =
      dims.length === 1 && !Array.isArray(arrayMeta['dimension_names']);

    // Fail loud on a key matching no dimension, rather than silently rendering
    // the wrong slice.
    for (const key of dimKeys) {
      if (!names.includes(key) && !singleUnnamed) {
        throw new Error(
          `GeoZarr: unknown dimension "${key}" in the \`dimensions\` option; ` +
            `available: [${names.join(', ')}].`,
        );
      }
    }

    const selection = new Array(arrayMeta['shape'].length).fill(null);
    for (const dim of dims) {
      const name = dim.name;
      let index;
      if (name in dimensions) {
        index = dimensions[name];
      } else if (singleUnnamed && dimKeys.length === 1) {
        index = dimensions[dimKeys[0]];
      } else {
        index = 0; // unspecified extra dimension defaults to the first slice
      }
      if (typeof index === 'string') {
        // Labels are resolved once, when the source configures.
        throw new Error(
          `GeoZarr: coordinate labels cannot be passed to updateDimensions; ` +
            `pass an integer index for dimension "${name}".`,
        );
      }
      if (
        !Number.isInteger(index) ||
        /** @type {number} */ (index) < 0 ||
        /** @type {number} */ (index) >= dim.size
      ) {
        throw new Error(
          `GeoZarr: invalid index ${index} for dimension "${name}" ` +
            `(size ${dim.size}).`,
        );
      }
      selection[dim.axis] = /** @type {number} */ (index);
    }
    return selection;
  }

  /**
   * Build the tile grid and the per-level band layout. Every store is read as a
   * stack of levels holding n-dimensional arrays: in `variable` mode all bands
   * are slices of one array, otherwise each band has an array of its own.
   * @param {Object<string, *>} attributes The dataset attributes.
   * @param {FetchStore} store The store, for metadata requests not covered
   * by consolidated metadata.
   * @return {Promise<boolean>} Whether the tile grid has explicit tile sizes.
   * @private
   */
  async configureLevels_(attributes, store) {
    const variable = this.variable_;
    // The arrays to look for at each level, and how to name them in messages.
    const arrayNames = variable ? [variable] : this.bands_;
    const what = variable
      ? `variable "${variable}"`
      : `bands [${arrayNames.join(', ')}]`;
    // For multi-group mode, use sub-metadata for the first group so that
    // consolidated metadata keys match the expected relative paths.
    const consolidatedMetadata = this.consolidatedMetadata_
      ? this.groupMetadata_(0)
      : null;

    // Collect the multiscale level paths; without multiscale metadata the
    // group itself is the only level.
    const multiscales = attributes['multiscales'];
    /** @type {Array<{path: string, transform: Array<number>|undefined, shape: Array<number>|undefined}>} */
    const rawLevels = [];
    /** @type {string|null} */
    let crsHint = null;
    if (
      Array.isArray(multiscales) &&
      multiscales.length > 0 &&
      Array.isArray(multiscales[0].datasets)
    ) {
      for (const dataset of multiscales[0].datasets) {
        const path =
          dataset.path === '.' || !dataset.path
            ? ''
            : String(dataset.path).replace(/\/+$/, '');
        rawLevels.push({
          path,
          transform: dataset['spatial:transform'],
          shape: dataset['spatial:shape'],
        });
        if (!crsHint && typeof dataset['crs'] === 'string') {
          crsHint = dataset['crs'];
        }
      }
    } else if (multiscales && Array.isArray(multiscales.layout)) {
      for (const entry of multiscales.layout) {
        // The declared `spatial:transform` is deliberately ignored here: its
        // resolution is rounded in real stores (e.g. 720 where the extent and
        // shape give 722.37), which leaves a sliver of a tile beyond the last
        // full one. All layout levels share the group origin, so deriving the
        // resolution from the extent and shape is both exact and sufficient.
        rawLevels.push({
          path: String(entry.asset),
          transform: undefined,
          shape: entry['spatial:shape'],
        });
      }
    } else {
      rawLevels.push({
        path: '',
        transform: attributes['spatial:transform'],
        shape: attributes['spatial:shape'],
      });
    }

    // Keep only the levels that hold at least one of the wanted arrays. Without
    // consolidated metadata their presence cannot be checked up front.
    /** @type {Array<{path: string, bands: Array<string>, meta: any, transform: Array<number>|undefined, shape: Array<number>|undefined}>} */
    const levels = [];
    for (const raw of rawLevels) {
      const bands = consolidatedMetadata
        ? arrayNames.filter(
            (name) => consolidatedMetadata[arrayPathOf(raw.path, name)],
          )
        : arrayNames.slice();
      if (bands.length === 0) {
        warn(`No ${what} found at level "${raw.path || '.'}"`);
        continue;
      }
      levels.push({
        ...raw,
        bands,
        meta: consolidatedMetadata
          ? consolidatedMetadata[arrayPathOf(raw.path, bands[0])]
          : undefined,
      });
    }
    if (levels.length === 0) {
      throw new Error(`No level found holding ${what}`);
    }

    // The dimension layout is the same for all levels. It is only needed when
    // the levels do not declare their shape, or to slice a `variable`.
    let meta = levels.find((level) => level.meta)?.meta;
    if (!meta && (variable || !levels.every((l) => Array.isArray(l.shape)))) {
      meta = await getArrayMeta(
        store,
        arrayPathOf(levels[0].path, levels[0].bands[0]),
        this.openFn_ === open.v2,
      );
      levels[0].meta = meta;
    }
    const hasMeta = !!meta && Array.isArray(meta.shape);
    if (variable && !hasMeta) {
      throw new Error(`Could not read metadata for variable "${variable}"`);
    }
    const ndim = hasMeta ? meta.shape.length : 2;
    let dimensionNames = hasMeta ? meta['dimension_names'] : undefined;
    if (!dimensionNames && ndim === 2) {
      dimensionNames = ['y', 'x'];
    }
    if (variable && !dimensionNames) {
      throw new Error(
        `Cannot determine dimension names for variable "${variable}"`,
      );
    }
    const {row, col} = hasMeta
      ? getSpatialAxes(attributes['spatial:dimensions'], meta)
      : {row: 0, col: 1};

    // Determine the extent and y axis orientation: declared metadata is
    // authoritative, otherwise both are inferred from the coordinate arrays.
    let extent = attributes['spatial:bbox'] || attributes['bounds'];
    let flipY = false;
    let orientationKnown = false;
    const transform0 = levels[0].transform;
    if (
      extent &&
      Array.isArray(transform0) &&
      transform0.length >= 6 &&
      transform0[4] !== 0
    ) {
      flipY = transform0[4] > 0;
      orientationKnown = true;
    } else if (extent && levels.every((l) => Array.isArray(l.shape))) {
      // Levels that declare their `spatial:shape` alongside a declared extent
      // follow the spatial: convention, which stores rasters north-up. Reading
      // coordinate arrays would only confirm that, at the cost of two requests.
      orientationKnown = true;
    } else {
      // All levels share the extent; the smallest level is cheapest to read
      let coordLevel = levels[0];
      for (const level of levels) {
        if (
          level.meta &&
          coordLevel.meta &&
          level.meta.shape[col] < coordLevel.meta.shape[col]
        ) {
          coordLevel = level;
        }
      }
      try {
        const [x0, x1, xCount] = await this.readCoordinateEndpoints_(
          coordLevel.path,
          dimensionNames[col],
        );
        const [y0, y1, yCount] = await this.readCoordinateEndpoints_(
          coordLevel.path,
          dimensionNames[row],
        );
        flipY = y1 > y0;
        orientationKnown = true;
        if (x1 < x0) {
          warn('Descending x coordinates are not supported.');
        }
        if (!extent) {
          // Coordinates are pixel centers; pad by half a pixel
          const xResolution = Math.abs(x1 - x0) / (xCount - 1);
          const yResolution = Math.abs(y1 - y0) / (yCount - 1);
          extent = [
            Math.min(x0, x1) - xResolution / 2,
            Math.min(y0, y1) - yResolution / 2,
            Math.max(x0, x1) + xResolution / 2,
            Math.max(y0, y1) + yResolution / 2,
          ];
          // Normalize [0, 360]-style longitudes to [-180, 180]
          if (extent[0] >= 0 && extent[2] > 180 && extent[2] <= 360.001) {
            extent = [extent[0] - 360, extent[1], extent[2] - 360, extent[3]];
          }
        }
      } catch (err) {
        if (!extent && !this.fallbackExtent_) {
          throw new Error(
            `Could not determine the extent of variable "${variable}" ` +
              `from metadata or coordinate arrays: ${/** @type {Error} */ (err).message}`,
          );
        }
      }
    }
    if (!extent) {
      extent = this.fallbackExtent_;
    }
    if (!orientationKnown && this.fallbackFlipY_ !== undefined) {
      flipY = this.fallbackFlipY_;
    }

    const extentWidth = extent[2] - extent[0];
    const extentHeight = extent[3] - extent[1];
    /** @type {Array<{path: string, bands: Array<string>, meta: any, resolution: number, rowResolution: number, origin: import("../coordinate.js").Coordinate}>} */
    const configured = [];
    for (const level of levels) {
      let resolution;
      // Pixels are not necessarily square (e.g. a square array covering the
      // full EPSG:4326 world), so the row resolution is tracked separately.
      let rowResolution;
      let origin;
      if (
        Array.isArray(level.transform) &&
        level.transform.length >= 6 &&
        level.transform[4] < 0
      ) {
        resolution = level.transform[0];
        rowResolution = -level.transform[4];
        origin = [level.transform[2], level.transform[5]];
      } else if (Array.isArray(level.shape)) {
        resolution = extentWidth / level.shape[1];
        rowResolution = extentHeight / level.shape[0];
        origin = [extent[0], extent[3]];
      } else if (level.meta && Array.isArray(level.meta.shape)) {
        resolution = extentWidth / level.meta.shape[col];
        rowResolution = extentHeight / level.meta.shape[row];
        origin = [extent[0], extent[3]];
      } else {
        warn(`No resolution information for level "${level.path || '.'}"`);
        continue;
      }
      configured.push({
        path: level.path,
        bands: level.bands,
        meta: level.meta,
        resolution,
        rowResolution,
        origin,
      });
    }
    if (configured.length === 0) {
      throw new Error(`No usable level found for ${what}`);
    }
    configured.sort((a, b) => b.resolution - a.resolution);

    if (!this.projection) {
      this.projection = this.inferProjection_(attributes, crsHint, extent);
    }

    if (variable) {
      // Resolve the selection to per-axis indices; labels are resolved against
      // the finest level's coordinate arrays
      const finestPath = configured[configured.length - 1].path;
      /** @type {Array<{axis: number, indices: Array<number>}>} */
      const slots = [];
      this.multiAxis_ = -1;
      this.extraDimensions_ = [];
      for (let axis = 0; axis < ndim; ++axis) {
        if (axis === row || axis === col) {
          continue;
        }
        const dimName = dimensionNames[axis];
        this.extraDimensions_.push({name: dimName, size: meta.shape[axis]});
        let value = this.dimensions_[dimName];
        if (value === undefined) {
          warn(`No value given for dimension "${dimName}", using index 0.`);
          value = 0;
        }
        /** @type {Array<number|string>} */
        let values;
        if (Array.isArray(value)) {
          values = value;
          this.multiAxis_ = axis;
        } else {
          values = [value];
        }
        const indices = [];
        for (const v of values) {
          if (typeof v === 'number') {
            indices.push(v);
          } else {
            indices.push(
              await this.resolveCoordinateLabel_(
                dimName,
                v,
                arrayPathOf(finestPath, dimName),
              ),
            );
          }
        }
        for (const index of indices) {
          if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= meta.shape[axis]
          ) {
            throw new Error(
              `GeoZarr: invalid index ${index} for dimension "${dimName}" ` +
                `(size ${meta.shape[axis]}).`,
            );
          }
        }
        slots.push({axis, indices});
      }

      // Materialize the datacube as the per-band state that loadTile_
      // consumes: each rendered band is the variable array with fixed indices
      // at the non-spatial axes.
      const count = this.bandCount;
      this.bands_ = new Array(count).fill(variable);
      this.bandGroupIndex_ = new Array(count).fill(0);
      this.bandSingleScaleResolution_ = new Array(count).fill(undefined);
      this.bandSpatialAxes_ = new Array(count).fill({row, col});
      this.bandExtraSelection_ = new Array(count)
        .fill(undefined)
        .map((_, bandIndex) => {
          if (slots.length === 0) {
            return undefined;
          }
          const selection = new Array(ndim).fill(null);
          for (const slot of slots) {
            selection[slot.axis] =
              slot.axis === this.multiAxis_
                ? slot.indices[bandIndex]
                : slot.indices[0];
          }
          return selection;
        });
    }

    if (meta) {
      this.fillValue_ = parseFillValue(meta['fill_value']);
    }

    // Align tiles to shards or chunks: every tile decodes all chunks it
    // touches, so tiles much smaller than a chunk would decode the same
    // chunk over and over.
    const tileSizes = configured.map((level) => {
      if (!level.meta) {
        return undefined;
      }
      const shardInfo = getShardInfo(level.meta, row, col);
      if (shardInfo) {
        return /** @type {import("../size.js").Size} */ ([
          getTileSizeForShard(
            shardInfo.shardShape[1],
            shardInfo.innerChunkShape[1],
          ),
          getTileSizeForShard(
            shardInfo.shardShape[0],
            shardInfo.innerChunkShape[0],
          ),
        ]);
      }
      // Unsharded chunks only need alignment when they are larger than a
      // default tile, which would decode the same chunk for every tile it spans.
      const chunkShape = level.meta['chunk_grid']?.configuration?.chunk_shape;
      if (
        Array.isArray(chunkShape) &&
        Math.max(chunkShape[row], chunkShape[col]) > DEFAULT_TILE_SIZE
      ) {
        return /** @type {import("../size.js").Size} */ ([
          getTileSizeForChunk(chunkShape[col], level.meta.shape[col]),
          getTileSizeForChunk(chunkShape[row], level.meta.shape[row]),
        ]);
      }
      return undefined;
    });
    const hasTileSizes = tileSizes.some((s) => s !== undefined);

    this.bandsByLevel_ = {};
    this.levelPaths_ = {};
    this.levelRowInfo_ = {};
    const matrixIds = configured.map((level, i) => level.path || String(i));
    for (let i = 0; i < configured.length; ++i) {
      const level = configured[i];
      this.bandsByLevel_[matrixIds[i]] = level.bands;
      this.levelPaths_[matrixIds[i]] = level.path;
      this.levelRowInfo_[matrixIds[i]] = {
        rowResolution: level.rowResolution,
        shapeY:
          level.meta && Array.isArray(level.meta.shape)
            ? level.meta.shape[row]
            : undefined,
        flip: flipY,
      };
    }
    this.tileGrid = new WMTSTileGrid({
      extent: extent,
      origins: configured.map((level) => level.origin),
      resolutions: configured.map((level) => level.resolution),
      matrixIds: matrixIds,
      ...(hasTileSizes
        ? {tileSizes: tileSizes.map((s) => s || [256, 256])}
        : {}),
    });
    return hasTileSizes;
  }

  /**
   * Determine the projection from the store metadata: the proj: convention,
   * a CRS code from the multiscale metadata or xarray-style attributes, a
   * `proj4` definition, or (for degree-like extents) EPSG:4326.
   * @param {Object<string, *>} attributes The dataset attributes.
   * @param {string|null} crsHint A CRS code from the multiscale metadata.
   * @param {import("../extent.js").Extent} extent The extent.
   * @return {import("../proj/Projection.js").default} The projection.
   * @private
   */
  inferProjection_(attributes, crsHint, extent) {
    try {
      const projection = getProjectionFromAttributes(
        /** @type {DatasetAttributes} */ (attributes),
      );
      if (projection) {
        return projection;
      }
    } catch {
      // not declared through the proj: convention
    }
    const code =
      crsHint ||
      (typeof attributes['spatial_ref'] === 'string' &&
      attributes['spatial_ref'].includes(':')
        ? attributes['spatial_ref']
        : null);
    if (code) {
      const projection = getProjection(code);
      if (projection) {
        return projection;
      }
    }
    const definition = attributes['proj4'] || attributes['proj4_params'];
    if (typeof definition === 'string') {
      try {
        const projection = fromProjectionDefinition(definition);
        if (projection) {
          return projection;
        }
      } catch (err) {
        warn(
          `Could not register the proj4 definition: ${/** @type {Error} */ (err).message}`,
        );
      }
    }
    if (
      extent &&
      extent[0] >= -360 &&
      extent[2] <= 360.001 &&
      extent[1] >= -90 &&
      extent[3] <= 90
    ) {
      // Extent magnitude suggests degrees
      return /** @type {import('../proj/Projection.js').default} */ (
        getProjection('EPSG:4326')
      );
    }
    throw new Error('Could not determine the projection');
  }

  /**
   * Read the first and last value of a 1-dimensional coordinate array.
   * @param {string} levelPath The level group path ('' for the root).
   * @param {string} dimName The dimension (and coordinate array) name.
   * @return {Promise<Array<number>>} The first value, last value, and length.
   * @private
   */
  async readCoordinateEndpoints_(levelPath, dimName) {
    const path = levelPath ? `${levelPath}/${dimName}` : dimName;
    const array = await this.openArray_(0, path);
    const length = array.shape[0];
    const first = await get(array, [slice(0, 1)]);
    const last = await get(array, [slice(length - 1, length)]);
    return [
      Number(/** @type {ArrayLike<number>} */ (first.data)[0]),
      Number(/** @type {ArrayLike<number>} */ (last.data)[0]),
      length,
    ];
  }

  /**
   * Resolve a coordinate label to its index by reading the dimension's
   * coordinate array.
   * @param {string} dimName The dimension name.
   * @param {string} label The label to resolve.
   * @param {string} path The coordinate array path, relative to the group.
   * @return {Promise<number>} The index of the label.
   * @private
   */
  async resolveCoordinateLabel_(dimName, label, path) {
    try {
      const array = await this.openArray_(0, path);
      const chunk = await get(array, [null]);
      const values = Array.from(chunk.data, (v) => String(v));
      const index = values.indexOf(label);
      if (index < 0) {
        throw new Error(
          `Label not found. Available: ${values.slice(0, 10).join(', ')}`,
        );
      }
      return index;
    } catch (err) {
      throw new Error(
        `Could not resolve label "${label}" for dimension "${dimName}": ` +
          `${/** @type {Error} */ (err).message} Pass a numeric index instead.`,
      );
    }
  }
}

/**
 * Extract a sub-view of consolidated metadata for a specific group path.
 * Keys in the returned object are relative to the group path.
 * @param {Object<string, *>} rootMetadata The root consolidated metadata.
 * @param {string} groupPath The group path (e.g. 'measurements/reflectance').
 * @return {Object<string, *>} Sub-metadata with paths relative to the group.
 */
function getSubMetadata(rootMetadata, groupPath) {
  const prefix = groupPath + '/';
  /** @type {Object<string, *>} */
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
 * @param {Object<string, *>} consolidatedMetadata The parsed consolidated_metadata.metadata entries.
 * @return {import('zarrita').Readable} A store-compatible object.
 */
function createCachedStore(store, groupBytes, consolidatedMetadata) {
  const cache = new Map();
  cache.set('/zarr.json', groupBytes);
  const encoder = new TextEncoder();
  for (const [key, value] of Object.entries(consolidatedMetadata)) {
    cache.set(
      /** @type {`/${string}`} */ (`/${key}/zarr.json`),
      encoder.encode(JSON.stringify(value)),
    );
  }
  return withChunkCache({
    async get(
      /** @type {string} */ key,
      /** @type {import('zarrita').GetOptions|undefined} */ opts,
    ) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      return store.get(/** @type {`/${string}`} */ (key), opts);
    },
    getRange: store.getRange?.bind(store),
  });
}

/***
 * @typedef {{
 *   multiscales: Multiscales,
 *   zarr_conventions: Array<{uuid: string}>,
 *   'spatial:bbox': import("../extent.js").Extent,
 *   'spatial:shape': Array<number>,
 *   'spatial:dimensions'?: Array<string>,
 *   'proj:wkt2'?: string,
 *   'proj:projjson'?: Object,
 *   'proj:code'?: string | null,
 * }} DatasetAttributes
 */

/**
 * @typedef {Object} Multiscales
 * @property {Array<Object<string, *>>} layout The layout.
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
 * The path of a band array within its group.
 * @param {string} levelPath The level group path (empty for the group root).
 * @param {string} name The array name.
 * @return {string} The path, relative to the group.
 */
function arrayPathOf(levelPath, name) {
  return levelPath ? `${levelPath}/${name}` : name;
}

/**
 * Locate the row (y) and column (x) axis positions of an array by matching the
 * group's `spatial:dimensions` names (`[y, x]`) against the array's
 * `dimension_names`, falling back to the two trailing axes when either is absent.
 * @param {Array<string>|undefined} spatialDimensionNames The `spatial:dimensions` value (`[y, x]` names).
 * @param {Object<string, *>|undefined} arrayMeta Zarr v3 array metadata.
 * @return {{row: number, col: number}} The row (y) and column (x) axis positions.
 */
function getSpatialAxes(spatialDimensionNames, arrayMeta) {
  const rank = ((arrayMeta && arrayMeta['shape']) || []).length;
  const names = arrayMeta && arrayMeta['dimension_names'];
  if (
    Array.isArray(spatialDimensionNames) &&
    spatialDimensionNames.length === 2 &&
    Array.isArray(names)
  ) {
    const row = names.indexOf(spatialDimensionNames[0]);
    const col = names.indexOf(spatialDimensionNames[1]);
    if (row !== -1 && col !== -1) {
      return {row, col};
    }
  }
  return {row: rank - 2, col: rank - 1};
}

/**
 * FIXME Remove this when GeoZarr datasets provide correct TileMatrixSet info or similar.
 *
 * Get the shard and inner chunk shapes from the Zarr v3 array metadata.
 * Only returns info when a `sharding_indexed` codec is present, meaning
 * `chunk_grid.configuration.chunk_shape` represents the shard (outer chunk) size.
 * @param {Object<string, *>} arrayMeta The Zarr v3 array metadata from consolidated metadata.
 * @param {number} row The row (y) axis position.
 * @param {number} col The column (x) axis position.
 * @return {ShardInfo|undefined} The shard info, or undefined.
 */
function getShardInfo(arrayMeta, row, col) {
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
  // Keep only the two spatial axes; the chunk/shard shapes are N-D for N-D arrays.
  const shardShape = chunkGrid['configuration']['chunk_shape'];
  const innerChunkShape = shardingCodec['configuration']['chunk_shape'];
  return {
    shardShape: [shardShape[row], shardShape[col]],
    innerChunkShape: [innerChunkShape[row], innerChunkShape[col]],
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
  if (innerChunkSize > MAX_TILE_SIZE) {
    // Use the largest divisor of the inner chunk size that fits, so that a
    // whole number of tiles covers each inner chunk.
    for (let size = MAX_TILE_SIZE; size >= MIN_TILE_SIZE; --size) {
      if (innerChunkSize % size === 0) {
        return size;
      }
    }
    return MAX_TILE_SIZE;
  }
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
      extent: tileGrid.getExtent() ?? undefined,
      origins: tileGrid.getOrigins() ?? undefined,
      resolutions: tileGrid.getResolutions(),
      matrixIds: tileGrid.getMatrixIds(),
    });
  }
  return {
    tileGrid,
    projection: /** @type {import("../proj/Projection.js").default} */ (
      info.projection
    ),
  };
}

/**
 * @param {Array<import("zarrita").Chunk<import("zarrita").DataType>>} chunks The input chunks.
 * @param {Array<number>} chunkResolutions The resolutions for each band.
 * @param {number} tileColCount The number of columns in the output data.
 * @param {number} tileRowCount The number of rows in the output data.
 * @param {number} tileResolution The tile resolution.
 * @param {ResampleMethod} resampleMethod The resampling method.
 * @param {number|undefined} fillValue The fill value.
 * @param {Array<number>} [chunkRowResolutions] The row resolutions for each
 * band, for data with non-square pixels. Defaults to `chunkResolutions`.
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
  chunkRowResolutions = chunkResolutions,
) {
  const chunkCount = chunks.length;
  const addAlpha = fillValue !== null && fillValue !== undefined;
  const isNoDataValue = isNaN(/** @type {number} */ (fillValue))
    ? (/** @type {number} */ v) => isNaN(v)
    : (/** @type {number} */ v) => v === fillValue;
  const bandCount = chunkCount + (addAlpha ? 1 : 0);
  const tileData = new Float32Array(tileColCount * tileRowCount * bandCount);
  for (let tileRow = 0; tileRow < tileRowCount; tileRow++) {
    for (let tileCol = 0; tileCol < tileColCount; tileCol++) {
      let hasData = false;
      for (let chunkIndex = 0; chunkIndex < chunkCount; ++chunkIndex) {
        const chunk = chunks[chunkIndex];
        const chunkRowCount = chunk.shape[0];
        const chunkColCount = chunk.shape[1];
        const chunkData = /** @type {ArrayLike<number>} */ (chunk.data);
        const scaleFactor = tileResolution / chunkResolutions[chunkIndex];
        const rowScaleFactor = tileResolution / chunkRowResolutions[chunkIndex];
        let value = 0;
        let inBounds = false;
        if (scaleFactor === 1 && rowScaleFactor === 1) {
          if (tileRow < chunkRowCount && tileCol < chunkColCount) {
            inBounds = true;
            value = chunkData[tileRow * chunkColCount + tileCol];
          }
        } else {
          const chunkRow = tileRow * rowScaleFactor;
          const chunkCol = tileCol * scaleFactor;
          switch (resampleMethod) {
            case 'nearest': {
              const valueRow = Math.round(chunkRow);
              const valueCol = Math.round(chunkCol);
              if (valueRow < chunkRowCount && valueCol < chunkColCount) {
                inBounds = true;
                value = chunkData[valueRow * chunkColCount + valueCol];
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

                const v00 = chunkData[row0 * chunkColCount + col0];
                const v01 = chunkData[row0 * chunkColCount + col1];
                const v10 = chunkData[row1 * chunkColCount + col0];
                const v11 = chunkData[row1 * chunkColCount + col1];

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

/**
 * @param {DatasetAttributes} attributes Attriutes.
 * @return {import("../proj/Projection.js").default} The projection.
 */
function getProjectionFromAttributes(attributes) {
  const projCode = attributes['proj:code'];
  if (projCode) {
    return /** @type {import("../proj/Projection.js").default} */ (
      getProjection(projCode)
    );
  }
  const projDef = attributes['proj:projjson'] || attributes['proj:wkt2'];
  return /** @type {import("../proj/Projection.js").default} */ (
    fromProjectionDefinition(projDef)
  );
}

/**
 * Maximum number of requests to keep in the per-source chunk cache.
 * @type {number}
 */
const MAX_CACHED_CHUNKS = 32;

/**
 * Wrap a store with a small LRU cache for chunk requests. Adjacent tiles
 * often read from the same chunk (in the extreme case, a store with a single
 * chunk per array); without this cache each tile would fetch the chunk
 * again, as zarrita does not cache requests.
 * @param {import('zarrita').FetchStore|import('zarrita').Readable} store The store to wrap.
 * @return {import('zarrita').Readable} A store-compatible object.
 */
function withChunkCache(store) {
  /** @type {Map<string, Promise<Uint8Array|undefined>>} */
  const chunkCache = new Map();
  return /** @type {import('zarrita').Readable} */ ({
    async get(
      /** @type {string} */ key,
      /** @type {import('zarrita').GetOptions|undefined} */ opts,
    ) {
      if (chunkCache.has(key)) {
        // Re-insert to mark the entry as most recently used
        const cached = /** @type {Promise<Uint8Array|undefined>} */ (
          chunkCache.get(key)
        );
        chunkCache.delete(key);
        chunkCache.set(key, cached);
        return cached;
      }
      const promise = /** @type {Promise<Uint8Array|undefined>} */ (
        store.get(/** @type {`/${string}`} */ (key), opts)
      );
      chunkCache.set(key, promise);
      promise.catch(() => chunkCache.delete(key));
      if (chunkCache.size > MAX_CACHED_CHUNKS) {
        chunkCache.delete(
          /** @type {string} */ (chunkCache.keys().next().value),
        );
      }
      return promise;
    },
    getRange: /** @type {*} */ (store).getRange?.bind(store),
  });
}

/**
 * Like {@link createCachedStore}, for Zarr v2 consolidated metadata: the
 * .zmetadata entries are served under their raw keys (e.g. `path/.zarray`).
 * @param {import('zarrita').FetchStore} store The underlying store.
 * @param {Object<string, *>} v2Metadata The .zmetadata `metadata` entries.
 * @return {import('zarrita').Readable} A store-compatible object.
 */
function createCachedStoreV2(store, v2Metadata) {
  const cache = new Map();
  const encoder = new TextEncoder();
  for (const [key, value] of Object.entries(v2Metadata)) {
    cache.set(`/${key}`, encoder.encode(JSON.stringify(value)));
  }
  return withChunkCache({
    async get(
      /** @type {string} */ key,
      /** @type {import('zarrita').GetOptions|undefined} */ opts,
    ) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      return store.get(/** @type {`/${string}`} */ (key), opts);
    },
    getRange: store.getRange?.bind(store),
  });
}

/**
 * Maximum tile size when tiles are aligned to (unsharded) chunks. Larger
 * than MAX_TILE_SIZE because decoding one big chunk into a single tile is
 * cheaper than decoding it once per covering tile.
 * @type {number}
 */
const MAX_CHUNK_TILE_SIZE = 2048;

/**
 * Compute a tile size for an unsharded array along one dimension: a multiple
 * of the chunk size when chunks are small, or (a cap of) the chunk size
 * itself when chunks are large.
 * @param {number} chunkSize The chunk size in pixels along one dimension.
 * @param {number} arraySize The array size in pixels along the same dimension.
 * @return {number} The tile size.
 */
function getTileSizeForChunk(chunkSize, arraySize) {
  let size;
  if (chunkSize >= MAX_TILE_SIZE) {
    size = Math.min(chunkSize, MAX_CHUNK_TILE_SIZE);
  } else {
    size = Math.floor(MAX_TILE_SIZE / chunkSize) * chunkSize;
  }
  return Math.max(MIN_TILE_SIZE, Math.min(size, arraySize));
}

/**
 * Parse a Zarr fill value (which may be encoded as a string like "NaN").
 * @param {number|string|null|undefined} value The raw fill value.
 * @return {number|undefined} The fill value as a number, or undefined.
 */
function parseFillValue(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return undefined;
}

/**
 * Normalize Zarr v2 consolidated metadata (.zmetadata entries like
 * `path/.zarray` and `path/.zattrs`) into the Zarr v3 shape that this
 * source reads.
 * @param {Object<string, *>} v2Metadata The .zmetadata `metadata` entries.
 * @return {Object<string, *>} Array metadata by path.
 */
function normalizeV2Metadata(v2Metadata) {
  /** @type {Object<string, *>} */
  const normalized = {};
  for (const [key, value] of Object.entries(v2Metadata)) {
    if (!key.endsWith('/.zarray')) {
      continue;
    }
    const path = key.slice(0, -'/.zarray'.length);
    const attributes = v2Metadata[`${path}/.zattrs`] || {};
    normalized[path] = {
      shape: value['shape'],
      fill_value: value['fill_value'],
      dimension_names: attributes['_ARRAY_DIMENSIONS'],
      chunk_grid: {
        name: 'regular',
        configuration: {chunk_shape: value['chunks']},
      },
      attributes,
    };
  }
  return normalized;
}

/**
 * Probe the store for an optional metadata document. Absence yields
 * `undefined`; any other failure is thrown, so that a server error is not
 * mistaken for a missing document.
 * @param {FetchStore} store The store.
 * @param {string} key The key to probe.
 * @return {Promise<Uint8Array|undefined>} The document, if present.
 */
function probe(store, key) {
  return store.get(/** @type {`/${string}`} */ (key));
}

/**
 * Fetch for the Zarr store, reporting a 403 as a missing key. S3 answers 403
 * for a key that is not there whenever the caller lacks `s3:ListBucket`, the
 * usual setup for publicly readable objects.
 * @param {Request} request The request.
 * @return {Promise<Response>} The response.
 */
function storeFetch(request) {
  return fetch(request).then((response) =>
    response.status === 403 ? new Response(null, {status: 404}) : response,
  );
}

/**
 * Read a single array's metadata directly from the store, for stores
 * without consolidated metadata (Zarr v3 zarr.json or v2 .zarray/.zattrs).
 * @param {FetchStore} store The store.
 * @param {string} path The array path.
 * @param {boolean} v2 Whether the store is Zarr v2.
 * @return {Promise<Object|undefined>} The array metadata (v3 shape).
 */
async function getArrayMeta(store, path, v2) {
  const decoder = new TextDecoder();
  if (!v2) {
    const bytes = await probe(store, `/${path}/zarr.json`);
    return bytes ? JSON.parse(decoder.decode(bytes)) : undefined;
  }
  const bytes = await probe(store, `/${path}/.zarray`);
  if (!bytes) {
    return undefined;
  }
  const zarray = JSON.parse(decoder.decode(bytes));
  const attrBytes = await probe(store, `/${path}/.zattrs`);
  const attributes = attrBytes ? JSON.parse(decoder.decode(attrBytes)) : {};
  return {
    shape: zarray['shape'],
    fill_value: zarray['fill_value'],
    dimension_names: attributes['_ARRAY_DIMENSIONS'],
    chunk_grid: {
      name: 'regular',
      configuration: {chunk_shape: zarray['chunks']},
    },
    attributes,
  };
}

/**
 * Flip the row order of a 2-dimensional chunk (for south-up data).
 * @param {{data: any, shape: Array<number>, stride: Array<number>}} chunk The chunk.
 * @return {{data: any, shape: Array<number>, stride: Array<number>}} The flipped chunk.
 */
function flipChunkRows(chunk) {
  const [rowCount, colCount] = chunk.shape;
  const source = chunk.data;
  const data = new source.constructor(source.length);
  for (let row = 0; row < rowCount; ++row) {
    data.set(
      source.subarray(
        (rowCount - 1 - row) * colCount,
        (rowCount - row) * colCount,
      ),
      row * colCount,
    );
  }
  return {data, shape: chunk.shape, stride: [colCount, 1]};
}
