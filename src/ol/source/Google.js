/**
 * @module ol/source/Google
 */

import TileImage from './TileImage.js';
import ViewHint from '../ViewHint.js';
import {createXYZ, extentFromProjection} from '../tilegrid.js';
import {getBottomLeft, getTopRight} from '../extent.js';
import {toLonLat} from '../proj.js';

const createSessionUrl = 'https://tile.googleapis.com/v1/createSession';
const tileUrl = 'https://tile.googleapis.com/v1/2dtiles';
const attributionUrl = 'https://tile.googleapis.com/tile/v1/viewport';
const maxZoom = 22;

/**
 * @typedef {Object} Options
 * @property {string} key Google Map Tiles API key. Get yours at https://developers.google.com/maps/documentation/tile/get-api-key.
 * @property {string} [mapType='roadmap'] The type of [base map](https://developers.google.com/maps/documentation/tile/session_tokens#required_fields).
 * @property {string} [language='en-US'] An [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) for information displayed on the tiles.
 * @property {string} [region='US'] A [Common Locale Data Repository](https://cldr.unicode.org/) (CLDR) region identifier that represents the user location.
 * @property {string} [imageFormat] The image format used for the map tiles (e.g. `'jpeg'`, or `'png'`).
 * @property {string} [scale] Scale for map elements (`'scaleFactor1x'`, `'scaleFactor2x'`, or `'scaleFactor4x'`).
 * @property {boolean} [highDpi=false] Use high-resolution tiles.
 * @property {Array<string>} [layerTypes] The layer types added to the map (e.g. `'layerRoadmap'`, `'layerStreetview'`, or `'layerTraffic'`).
 * @property {boolean} [overlay=false] Display only the `layerTypes` and not the underlying `mapType` (only works if `layerTypes` is provided).
 * @property {Array<Object>} [styles] [Custom styles](https://developers.google.com/maps/documentation/tile/style-reference) applied to the map.
 * @property {boolean} [attributionsCollapsible=true] Allow the attributions to be collapsed.
 * @property {boolean} [interpolate=true] Use interpolated values when resampling.  By default,
 * linear interpolation is used when resampling.  Set to false to use the nearest neighbor instead.
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least the number of tiles in the viewport.
 * @property {number} [reprojectionErrorThreshold=0.5] Maximum allowed reprojection error (in pixels).
 * Higher values can increase reprojection performance, but decrease precision.
 * @property {import("../Tile.js").LoadFunction} [tileLoadFunction] Optional function to load a tile given a URL. The default is
 * ```js
 * function(imageTile, src) {
 *   imageTile.getImage().src = src;
 * };
 * ```
 * @property {Array<string>} [apiOptions] An array of values specifying additional options to apply.
 * @property {boolean} [wrapX=true] Wrap the world horizontally.
 * @property {number} [transition] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @typedef {Object} SessionTokenRequest
 * @property {string} mapType The map type.
 * @property {string} language The language.
 * @property {string} region The region.
 * @property {string} [imageFormat] The image format.
 * @property {string} [scale] The scale.
 * @property {boolean} [highDpi] Use high resolution tiles.
 * @property {Array<string>} [layerTypes] The layer types.
 * @property {boolean} [overlay] The overlay.
 * @property {Array<Object>} [styles] The styles.
 * @property {Array<string>} [apiOptions] An array of values specifying additional options to apply.
 */

/**
 * @typedef {Object} SessionTokenResponse
 * @property {string} session The session token.
 * @property {string} expiry The session token expiry (seconds since the epoch as a string).
 * @property {number} tileWidth The tile width.
 * @property {number} tileHeight The tile height.
 * @property {string} imageFormat The image format.
 */

/**
 * @classdesc
 * A tile layer source that renders tiles from the Google [Map Tiles API](https://developers.google.com/maps/documentation/tile/overview).
 * The constructor takes options that are passed to the request to create a session token.  Refer to the
 * [documentation](https://developers.google.com/maps/documentation/tile/session_tokens#required_fields)
 * for additional details.
 * @api
 */
class Google extends TileImage {
  /**
   * @param {Options} options Google Maps options.
   */
  constructor(options) {
    const highDpi = !!options.highDpi;

    super({
      attributionsCollapsible: options.attributionsCollapsible,
      cacheSize: options.cacheSize,
      crossOrigin: 'anonymous',
      interpolate: options.interpolate,
      projection: 'EPSG:3857',
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      state: 'loading',
      tileLoadFunction: options.tileLoadFunction,
      tilePixelRatio: highDpi ? 2 : 1,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
      transition: options.transition,
      zDirection: options.zDirection,
    });

    /**
     * @type {string}
     * @private
     */
    this.apiKey_ = options.key;

    /**
     * @type {Error|null}
     * @private
     */
    this.error_ = null;

    /**
     * @type {SessionTokenRequest}
     */
    const sessionTokenRequest = {
      mapType: options.mapType || 'roadmap',
      language: options.language || 'en-US',
      region: options.region || 'US',
    };
    if (options.imageFormat) {
      sessionTokenRequest.imageFormat = options.imageFormat;
    }
    if (options.scale) {
      sessionTokenRequest.scale = options.scale;
    }
    if (highDpi) {
      sessionTokenRequest.highDpi = true;
    }
    if (options.layerTypes) {
      sessionTokenRequest.layerTypes = options.layerTypes;
    }
    if (options.styles) {
      sessionTokenRequest.styles = options.styles;
    }
    if (options.overlay === true) {
      sessionTokenRequest.overlay = true;
    }
    if (options.apiOptions) {
      sessionTokenRequest.apiOptions = options.apiOptions;
    }

    /**
     * @type {SessionTokenRequest}
     * @private
     */
    this.sessionTokenRequest_ = sessionTokenRequest;

    /**
     * @type {string}
     * @private
     */
    this.sessionTokenValue_;

    /**
     * @type {ReturnType<typeof setTimeout>}
     * @private
     */
    this.sessionRefreshId_;

    /**
     * @type {string}
     * @private
     */
    this.previousViewportAttribution_;

    /**
     * @type {string}
     * @private
     */
    this.previousViewportExtent_;

    this.createSession_();
  }

  /**
   * @return {Error|null} A source loading error. When the source state is `error`, use this function
   * to get more information about the error. To debug a faulty configuration, you may want to use
   * a listener like
   * ```js
   * source.on('change', () => {
   *   if (source.getState() === 'error') {
   *     console.error(source.getError());
   *   }
   * });
   * ```
   */
  getError() {
    return this.error_;
  }

  /**
   * Exposed here so it can be overridden in the tests.
   * @param {string} url The URL.
   * @param {RequestInit} config The config.
   * @return {Promise<Response>} A promise that resolves with the response.
   */
  fetchSessionToken(url, config) {
    return fetch(url, config);
  }

  /**
   * Get or renew a session token for use with tile requests.
   * @private
   */
  async createSession_() {
    const url = createSessionUrl + '?key=' + this.apiKey_;
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.sessionTokenRequest_),
    };

    const response = await this.fetchSessionToken(url, config);
    if (!response.ok) {
      try {
        const body = await response.json();
        this.error_ = new Error(body.error.message);
      } catch {
        this.error_ = new Error('Error fetching session token');
      }
      this.setState('error');
      return;
    }

    /**
     * @type {SessionTokenResponse}
     */
    const sessionTokenResponse = await response.json();

    const tilePixelRatio = this.getTilePixelRatio(1);
    const tileSize = [
      sessionTokenResponse.tileWidth / tilePixelRatio,
      sessionTokenResponse.tileHeight / tilePixelRatio,
    ];

    this.tileGrid = createXYZ({
      extent: extentFromProjection(this.getProjection()),
      maxZoom: maxZoom,
      tileSize: tileSize,
    });

    const session = sessionTokenResponse.session;
    this.sessionTokenValue_ = session;
    const key = this.apiKey_;
    this.tileUrlFunction = function (tileCoord, pixelRatio, projection) {
      const z = tileCoord[0];
      const x = tileCoord[1];
      const y = tileCoord[2];
      const url = `${tileUrl}/${z}/${x}/${y}?session=${session}&key=${key}`;
      return url;
    };

    const expiry = parseInt(sessionTokenResponse.expiry, 10) * 1000;
    const timeout = Math.max(expiry - Date.now() - 60 * 1000, 1);
    this.sessionRefreshId_ = setTimeout(() => this.createSession_(), timeout);

    this.setAttributions(this.fetchAttributions_.bind(this));
    // even if the state is already ready, we want the change event
    this.setState('ready');
  }

  /**
   * @param {import('../Map.js').FrameState} frameState The frame state.
   * @return {Promise<string>} The attributions.
   * @private
   */
  async fetchAttributions_(frameState) {
    if (
      frameState.viewHints[ViewHint.ANIMATING] ||
      frameState.viewHints[ViewHint.INTERACTING] ||
      frameState.animate
    ) {
      return this.previousViewportAttribution_;
    }
    const [west, south] = toLonLat(
      getBottomLeft(frameState.extent),
      frameState.viewState.projection,
    );
    const [east, north] = toLonLat(
      getTopRight(frameState.extent),
      frameState.viewState.projection,
    );
    const tileGrid = this.getTileGrid();
    const zoom = tileGrid.getZForResolution(
      frameState.viewState.resolution,
      this.zDirection,
    );
    const viewportExtent = `zoom=${zoom}&north=${north}&south=${south}&east=${east}&west=${west}`;
    // check if the extent or zoom has actually changed to avoid unnecessary requests
    if (this.previousViewportExtent_ == viewportExtent) {
      return this.previousViewportAttribution_;
    }
    this.previousViewportExtent_ = viewportExtent;
    const session = this.sessionTokenValue_;
    const key = this.apiKey_;
    const url = `${attributionUrl}?session=${session}&key=${key}&${viewportExtent}`;
    this.previousViewportAttribution_ = await fetch(url)
      .then((response) => response.json())
      .then((json) => json.copyright);

    return this.previousViewportAttribution_;
  }

  /**
   * @override
   */
  disposeInternal() {
    clearTimeout(this.sessionRefreshId_);
    super.disposeInternal();
  }
}

export default Google;
