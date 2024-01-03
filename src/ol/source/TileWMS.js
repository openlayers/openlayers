/**
 * @module ol/source/TileWMS
 */

import TileImage from './TileImage.js';
import {DEFAULT_VERSION, getImageSrc, getRequestParams} from './wms.js';
import {appendParams} from '../uri.js';
import {buffer, createEmpty} from '../extent.js';
import {calculateSourceResolution} from '../reproj.js';
import {compareVersions} from '../string.js';
import {get as getProjection, transform} from '../proj.js';
import {modulo} from '../math.js';
import {hash as tileCoordHash} from '../tilecoord.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {boolean} [attributionsCollapsible=true] Attributions are collapsible.
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least the number of tiles in the viewport.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {Object<string,*>} params WMS request parameters.
 * At least a `LAYERS` param is required. `STYLES` is
 * `''` by default. `VERSION` is `1.3.0` by default. `WIDTH`, `HEIGHT`, `BBOX`
 * and `CRS` (`SRS` for WMS version < 1.3.0) will be set dynamically.
 * @property {number} [gutter=0]
 * The size in pixels of the gutter around image tiles to ignore. By setting
 * this property to a non-zero value, images will be requested that are wider
 * and taller than the tile size by a value of `2 x gutter`.
 * Using a non-zero value allows artifacts of rendering at tile edges to be
 * ignored. If you control the WMS service it is recommended to address
 * "artifacts at tile edges" issues by properly configuring the WMS service. For
 * example, MapServer has a `tile_map_edge_buffer` configuration parameter for
 * this. See https://mapserver.org/output/tile_mode.html.
 * @property {boolean} [hidpi=true] Use the `ol/Map#pixelRatio` value when requesting
 * the image from the remote server.
 * @property {import("../proj.js").ProjectionLike} [projection] Projection. Default is the view projection.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {typeof import("../ImageTile.js").default} [tileClass] Class used to instantiate image tiles.
 * Default is {@link module:ol/ImageTile~ImageTile}.
 * @property {import("../tilegrid/TileGrid.js").default} [tileGrid] Tile grid. Base this on the resolutions,
 * tilesize and extent supported by the server.
 * If this is not defined, a default grid will be used: if there is a projection
 * extent, the grid will be based on that; if not, a grid based on a global
 * extent with origin at 0,0 will be used.
 * @property {import("./wms.js").ServerType} [serverType] The type of
 * the remote WMS server: `mapserver`, `geoserver`, `carmentaserver`, or `qgis`.
 * Only needed if `hidpi` is `true`.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {string} [url] WMS service URL.
 * @property {Array<string>} [urls] WMS service urls.
 * Use this instead of `url` when the WMS supports multiple urls for GetMap requests.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * When set to `false`, only one world
 * will be rendered. When `true`, tiles will be requested for one world only,
 * but they will be wrapped horizontally to render multiple worlds.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @classdesc
 * Layer source for tile data from WMS servers.
 * @api
 */
class TileWMS extends TileImage {
  /**
   * @param {Options} [options] Tile WMS options.
   */
  constructor(options) {
    options = options ? options : /** @type {Options} */ ({});

    const params = Object.assign({}, options.params);

    const transparent = 'TRANSPARENT' in params ? params['TRANSPARENT'] : true;

    super({
      attributions: options.attributions,
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      interpolate: options.interpolate,
      opaque: !transparent,
      projection: options.projection,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileClass: options.tileClass,
      tileGrid: options.tileGrid,
      tileLoadFunction: options.tileLoadFunction,
      url: options.url,
      urls: options.urls,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      transition: options.transition,
      zDirection: options.zDirection,
    });

    /**
     * @private
     * @type {number}
     */
    this.gutter_ = options.gutter !== undefined ? options.gutter : 0;

    /**
     * @private
     * @type {!Object}
     */
    this.params_ = params;

    /**
     * @private
     * @type {boolean}
     */
    this.v13_ = true;

    /**
     * @private
     * @type {import("./wms.js").ServerType}
     */
    this.serverType_ = options.serverType;

    /**
     * @private
     * @type {boolean}
     */
    this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.tmpExtent_ = createEmpty();

    this.updateV13_();
    this.setKey(this.getKeyForParams_());
  }

  /**
   * Return the GetFeatureInfo URL for the passed coordinate, resolution, and
   * projection. Return `undefined` if the GetFeatureInfo URL cannot be
   * constructed.
   * @param {import("../coordinate.js").Coordinate} coordinate Coordinate.
   * @param {number} resolution Resolution.
   * @param {import("../proj.js").ProjectionLike} projection Projection.
   * @param {!Object} params GetFeatureInfo params. `INFO_FORMAT` at least should
   *     be provided. If `QUERY_LAYERS` is not provided then the layers specified
   *     in the `LAYERS` parameter will be used. `VERSION` should not be
   *     specified here.
   * @return {string|undefined} GetFeatureInfo URL.
   * @api
   */
  getFeatureInfoUrl(coordinate, resolution, projection, params) {
    const projectionObj = getProjection(projection);
    const sourceProjectionObj = this.getProjection() || projectionObj;

    let tileGrid = this.getTileGrid();
    if (!tileGrid) {
      tileGrid = this.getTileGridForProjection(sourceProjectionObj);
    }

    const sourceProjCoord = transform(
      coordinate,
      projectionObj,
      sourceProjectionObj,
    );
    const sourceResolution = calculateSourceResolution(
      sourceProjectionObj,
      projectionObj,
      coordinate,
      resolution,
    );

    const z = tileGrid.getZForResolution(sourceResolution, this.zDirection);
    const tileResolution = tileGrid.getResolution(z);
    const tileCoord = tileGrid.getTileCoordForCoordAndZ(sourceProjCoord, z);

    if (tileGrid.getResolutions().length <= tileCoord[0]) {
      return undefined;
    }

    let tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);

    const gutter = this.gutter_;
    if (gutter !== 0) {
      tileExtent = buffer(tileExtent, tileResolution * gutter, tileExtent);
    }

    const baseParams = {
      'QUERY_LAYERS': this.params_['LAYERS'],
    };
    Object.assign(
      baseParams,
      getRequestParams(this.params_, 'GetFeatureInfo'),
      params,
    );

    const x = Math.floor((sourceProjCoord[0] - tileExtent[0]) / tileResolution);
    const y = Math.floor((tileExtent[3] - sourceProjCoord[1]) / tileResolution);

    baseParams[this.v13_ ? 'I' : 'X'] = x;
    baseParams[this.v13_ ? 'J' : 'Y'] = y;

    return this.getRequestUrl_(
      tileCoord,
      tileExtent,
      1,
      sourceProjectionObj || projectionObj,
      baseParams,
    );
  }

  /**
   * Return the GetLegendGraphic URL, optionally optimized for the passed
   * resolution and possibly including any passed specific parameters. Returns
   * `undefined` if the GetLegendGraphic URL cannot be constructed.
   *
   * @param {number} [resolution] Resolution. If set to undefined, `SCALE`
   *     will not be calculated and included in URL.
   * @param {Object} [params] GetLegendGraphic params. If `LAYER` is set, the
   *     request is generated for this wms layer, else it will try to use the
   *     configured wms layer. Default `FORMAT` is `image/png`.
   *     `VERSION` should not be specified here.
   * @return {string|undefined} GetLegendGraphic URL.
   * @api
   */
  getLegendUrl(resolution, params) {
    if (this.urls[0] === undefined) {
      return undefined;
    }

    const baseParams = {
      'SERVICE': 'WMS',
      'VERSION': DEFAULT_VERSION,
      'REQUEST': 'GetLegendGraphic',
      'FORMAT': 'image/png',
    };

    if (params === undefined || params['LAYER'] === undefined) {
      const layers = this.params_.LAYERS;
      const isSingleLayer = !Array.isArray(layers) || layers.length === 1;
      if (!isSingleLayer) {
        return undefined;
      }
      baseParams['LAYER'] = layers;
    }

    if (resolution !== undefined) {
      const mpu = this.getProjection()
        ? this.getProjection().getMetersPerUnit()
        : 1;
      const pixelSize = 0.00028;
      baseParams['SCALE'] = (resolution * mpu) / pixelSize;
    }

    Object.assign(baseParams, params);

    return appendParams(/** @type {string} */ (this.urls[0]), baseParams);
  }

  /**
   * @return {number} Gutter.
   */
  getGutter() {
    return this.gutter_;
  }

  /**
   * Get the user-provided params, i.e. those passed to the constructor through
   * the "params" option, and possibly updated using the updateParams method.
   * @return {Object} Params.
   * @api
   */
  getParams() {
    return this.params_;
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord Tile coordinate.
   * @param {import("../extent.js").Extent} tileExtent Tile extent.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../proj/Projection.js").default} projection Projection.
   * @param {Object} params Params.
   * @return {string|undefined} Request URL.
   * @private
   */
  getRequestUrl_(tileCoord, tileExtent, pixelRatio, projection, params) {
    const urls = this.urls;
    if (!urls) {
      return undefined;
    }
    let url;
    if (urls.length == 1) {
      url = urls[0];
    } else {
      const index = modulo(tileCoordHash(tileCoord), urls.length);
      url = urls[index];
    }

    return getImageSrc(
      tileExtent,
      (
        this.tileGrid || this.getTileGridForProjection(projection)
      ).getResolution(tileCoord[0]),
      pixelRatio,
      projection,
      url,
      params,
      this.serverType_,
    );
  }

  /**
   * Get the tile pixel ratio for this source.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Tile pixel ratio.
   */
  getTilePixelRatio(pixelRatio) {
    return !this.hidpi_ || this.serverType_ === undefined ? 1 : pixelRatio;
  }

  /**
   * @private
   * @return {string} The key for the current params.
   */
  getKeyForParams_() {
    let i = 0;
    const res = [];
    for (const key in this.params_) {
      res[i++] = key + '-' + this.params_[key];
    }
    return res.join('/');
  }

  /**
   * Update the user-provided params.
   * @param {Object} params Params.
   * @api
   */
  updateParams(params) {
    Object.assign(this.params_, params);
    this.updateV13_();
    this.setKey(this.getKeyForParams_());
  }

  /**
   * @private
   */
  updateV13_() {
    const version = this.params_['VERSION'] || DEFAULT_VERSION;
    this.v13_ = compareVersions(version, '1.3') >= 0;
  }

  /**
   * @param {import("../tilecoord.js").TileCoord} tileCoord The tile coordinate
   * @param {number} pixelRatio The pixel ratio
   * @param {import("../proj/Projection.js").default} projection The projection
   * @return {string|undefined} The tile URL
   * @override
   */
  tileUrlFunction(tileCoord, pixelRatio, projection) {
    let tileGrid = this.getTileGrid();
    if (!tileGrid) {
      tileGrid = this.getTileGridForProjection(projection);
    }

    if (tileGrid.getResolutions().length <= tileCoord[0]) {
      return undefined;
    }

    if (pixelRatio != 1 && (!this.hidpi_ || this.serverType_ === undefined)) {
      pixelRatio = 1;
    }

    const tileResolution = tileGrid.getResolution(tileCoord[0]);
    let tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent_);

    const gutter = this.gutter_;
    if (gutter !== 0) {
      tileExtent = buffer(tileExtent, tileResolution * gutter, tileExtent);
    }

    const baseParams = Object.assign(
      {},
      getRequestParams(this.params_, 'GetMap'),
    );

    return this.getRequestUrl_(
      tileCoord,
      tileExtent,
      pixelRatio,
      projection,
      baseParams,
    );
  }
}

export default TileWMS;
