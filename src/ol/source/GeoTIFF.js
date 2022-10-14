/**
 * @module ol/source/GeoTIFF
 */
import DataTile from './DataTile.js';
import TileGrid from '../tilegrid/TileGrid.js';
import {MessageClient} from '../util/worker.js';
import {
  Projection,
  get as getCachedProjection,
  toUserCoordinate,
  toUserExtent,
} from '../proj.js';
import {create as createGeoTIFFWorker} from '../worker/geotiff.js';
import {getCenter} from '../extent.js';

/**
 * @typedef {Object} SourceInfo
 * @property {string} [url] URL for the source GeoTIFF.
 * @property {Array<string>} [overviews] List of any overview URLs, only applies if the url parameter is given.
 * @property {Blob} [blob] Blob containing the source GeoTIFF. `blob` and `url` are mutually exclusive.
 * @property {number} [min=0] The minimum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.  If not provided and raster statistics are available, those will be used instead.
 * If neither are available, the minimum for the data type will be used.  To disable this behavior, set
 * the `normalize` option to `false` in the constructor.
 * @property {number} [max] The maximum source data value.  Rendered values are scaled from 0 to 1 based on
 * the configured min and max.  If not provided and raster statistics are available, those will be used instead.
 * If neither are available, the maximum for the data type will be used.  To disable this behavior, set
 * the `normalize` option to `false` in the constructor.
 * @property {number} [nodata] Values to discard (overriding any nodata values in the metadata).
 * When provided, an additional alpha band will be added to the data.  Often the GeoTIFF metadata
 * will include information about nodata values, so you should only need to set this property if
 * you find that it is not already extracted from the metadata.
 * @property {Array<number>} [bands] Band numbers to be read from (where the first band is `1`). If not provided, all bands will
 * be read. For example, if a GeoTIFF has blue (1), green (2), red (3), and near-infrared (4) bands, and you only need the
 * near-infrared band, configure `bands: [4]`.
 */

/**
 * @typedef {Object} GeoTIFFSourceOptions
 * @property {boolean} [forceXHR=false] Whether to force the usage of the browsers XMLHttpRequest API.
 * @property {Object<string, string>} [headers] additional key-value pairs of headers to be passed with each request. Key is the header name, value the header value.
 * @property {string} [credentials] How credentials shall be handled. See
 * https://developer.mozilla.org/en-US/docs/Web/API/fetch for reference and possible values
 * @property {number} [maxRanges] The maximum amount of ranges to request in a single multi-range request.
 * By default only a single range is used.
 * @property {boolean} [allowFullFile=false] Whether or not a full file is accepted when only a portion is
 * requested. Only use this when you know the source image to be small enough to fit in memory.
 * @property {number} [blockSize=65536] The block size to use.
 * @property {number} [cacheSize=100] The number of blocks that shall be held in a LRU cache.
 */

/**
 * @typedef {Object} Options
 * @property {Array<SourceInfo>} sources List of information about GeoTIFF sources.
 * Multiple sources can be combined when their resolution sets are equal after applying a scale.
 * The list of sources defines a mapping between input bands as they are read from each GeoTIFF and
 * the output bands that are provided by data tiles. To control which bands to read from each GeoTIFF,
 * use the {@link import("./GeoTIFF.js").SourceInfo bands} property. If, for example, you specify two
 * sources, one with 3 bands and {@link import("./GeoTIFF.js").SourceInfo nodata} configured, and
 * another with 1 band, the resulting data tiles will have 5 bands: 3 from the first source, 1 alpha
 * band from the first source, and 1 band from the second source.
 * @property {GeoTIFFSourceOptions} [sourceOptions] Additional options to be passed to [geotiff.js](https://geotiffjs.github.io/geotiff.js/module-geotiff.html)'s `fromUrl` or `fromUrls` methods.
 * @property {true|false|'auto'} [convertToRGB=false] By default, bands from the sources are read as-is. When
 * reading GeoTIFFs with the purpose of displaying them as RGB images, setting this to `true` will
 * convert other color spaces (YCbCr, CMYK) to RGB.  Setting the option to `'auto'` will make it so CMYK, YCbCr,
 * CIELab, and ICCLab images will automatically be converted to RGB.
 * @property {boolean} [normalize=true] By default, the source data is normalized to values between
 * 0 and 1 with scaling factors based on the raster statistics or `min` and `max` properties of each source.
 * If instead you want to work with the raw values in a style expression, set this to `false`.  Setting this option
 * to `false` will make it so any `min` and `max` properties on sources are ignored.
 * @property {boolean} [opaque=false] Whether the layer is opaque.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {boolean} [wrapX=false] Render tiles beyond the tile grid extent.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * the linear interpolation is used to resample the data.  If false, nearest neighbor is used.
 */

/**
 * @classdesc
 * A source for working with GeoTIFF data.
 * **Note for users of the full build**: The `GeoTIFF` source requires the
 * [geotiff.js](https://github.com/geotiffjs/geotiff.js) library to be loaded as well.
 *
 * @api
 */
class GeoTIFFSource extends DataTile {
  /**
   * @param {Options} options Data tile options.
   */
  constructor(options) {
    super({
      state: 'loading',
      tileGrid: null,
      projection: null,
      opaque: options.opaque,
      transition: options.transition,
      interpolate: options.interpolate !== false,
      wrapX: options.wrapX,
    });

    /**
     * @type {Array<SourceInfo>}
     */
    const sources = options.sources.map((source) => ({
      ...source,
      url: source.url && String(new URL(source.url, location.href)),
    }));

    /**
     * @type {Error}
     * @private
     */
    this.error_ = null;

    /**
     * @type {Worker}
     */
    this.worker_ = createGeoTIFFWorker();

    /**
     * @type {MessageClient}
     */
    this.messageClient_ = new MessageClient(this.worker_);

    this.setKey(sources.map((source) => source.url).join(','));

    this.configureLoader_({
      sources,
      sourceOptions: options.sourceOptions,
      convertToRGB: options.convertToRGB,
      normalize: options.normalize,
    });
  }

  disposeInternal() {
    if (this.messageClient_) {
      this.messageClient_.dispose();
      this.worker_.terminate();
      delete this.messageClient_;
      delete this.worker_;
    }
  }

  /**
   * @param {import("../worker/geotiff.js").LoaderOptions} options Loader options.
   */
  async configureLoader_(options) {
    /**
     * @type {import("../worker/geotiff.js").ConfigureRequest}
     */
    const request = {type: 'configure', options};

    try {
      const config = await this.messageClient_.postMessage(request);
      this.onReady_(config);
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
      this.onError_(error);
      return;
    }
  }

  /**
   * @param {Error} error An error.
   */
  onError_(error) {
    this.error_ = error;
    this.setState('error');
    this.viewRejector(error);
  }

  /**
   * @param {import("../worker/geotiff.js").ConfigureResponse} config The config response.
   */
  onReady_(config) {
    this.bandCount = config.bandCount;

    const tileGrid = new TileGrid({
      extent: config.extent,
      minZoom: config.minZoom,
      origin: config.origin,
      resolutions: config.resolutions,
      tileSizes: config.renderTileSizes,
    });

    this.tileGrid = tileGrid;
    this.setTileSizes(config.sourceTileSizes);

    if (!this.getProjection() && config.projection) {
      let projection = getCachedProjection(config.projection.code);
      if (!projection && config.projection.units) {
        projection = new Projection({
          code: config.projection.code,
          units: config.projection.units,
        });
      }
      if (projection) {
        this.projection = projection;
      }
    }

    this.setLoader(this.loadTile_.bind(this));
    this.setState('ready');

    let zoom = 0;
    let resolutions = config.resolutions;
    if (resolutions.length === 1) {
      resolutions = [resolutions[0] * 2, resolutions[0]];
      zoom = 1;
    }
    this.viewResolver({
      showFullExtent: true,
      projection: this.projection,
      resolutions: resolutions,
      center: toUserCoordinate(getCenter(config.extent), this.projection),
      extent: toUserExtent(config.extent, this.projection),
      zoom: zoom,
    });
  }

  /**
   * @return {Error} A source loading error. When the source state is `error`, use this function
   * to get more information about the error. To debug a faulty configuration, you may want to use
   * a listener like
   * ```js
   * geotiffSource.on('change', () => {
   *   if (geotiffSource.getState() === 'error') {
   *     console.error(geotiffSource.getError());
   *   }
   * });
   * ```
   */
  getError() {
    return this.error_;
  }

  /**
   * @param {number} z The z tile index.
   * @param {number} x The x tile index.
   * @param {number} y The y tile index.
   * @return {Promise<import("../DataTile.js").Data>} The composed tile data.
   * @private
   */
  loadTile_(z, x, y) {
    /**
     * @type {import("../worker/geotiff.js").LoadTileRequest}
     */
    const request = {type: 'load', x, y, z};
    return this.messageClient_.postMessage(request);
  }
}

/**
 * Get a promise for view properties based on the source.  Use the result of this function
 * as the `view` option in a map constructor.
 *
 *     const source = new GeoTIFF(options);
 *
 *     const map = new Map({
 *       target: 'map',
 *       layers: [
 *         new TileLayer({
 *           source: source,
 *         }),
 *       ],
 *       view: source.getView(),
 *     });
 *
 * @function
 * @return {Promise<import("../View.js").ViewOptions>} A promise for view-related properties.
 * @api
 *
 */
GeoTIFFSource.prototype.getView;

export default GeoTIFFSource;
