/**
 * @module ol/source/CartoDB
 */

import SourceState from './State.js';
import XYZ from './XYZ.js';
import {assign} from '../obj.js';

/**
 * @typedef {Object} Options
 * @property {import("./Source.js").AttributionLike} [attributions] Attributions.
 * @property {number} [cacheSize] Initial tile cache size. Will auto-grow to hold at least the number of tiles in the viewport.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images.  Note that
 * you must provide a `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {import("../proj.js").ProjectionLike} [projection='EPSG:3857'] Projection.
 * @property {number} [maxZoom=18] Max zoom.
 * @property {number} [minZoom] Minimum zoom.
 * @property {boolean} [wrapX=true] Whether to wrap the world horizontally.
 * @property {Object} [config] If using anonymous maps, the CartoDB config to use. See
 * https://carto.com/developers/maps-api/guides/anonymous-maps/
 * for more detail.
 * If using named maps, a key-value lookup with the template parameters.
 * See https://carto.com/developers/maps-api/guides/named-maps/
 * for more detail.
 * @property {string} [map] If using named maps, this will be the name of the template to load.
 * See https://carto.com/developers/maps-api/guides/named-maps/
 * for more detail.
 * @property {string} [account] Username as used to access public Carto dashboard at https://{username}.carto.com/.
 * @property {number} [transition=250] Duration of the opacity transition for rendering.
 * To disable the opacity transition, pass `transition: 0`.
 * @property {number|import("../array.js").NearestDirectionFunction} [zDirection=0]
 * Choose whether to use tiles with a higher or lower zoom level when between integer
 * zoom levels. See {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution}.
 */

/**
 * @typedef {Object} CartoDBLayerInfo
 * @property {string} layergroupid The layer group ID
 * @property {{https: string}} cdn_url The CDN URL
 */

/**
 * @classdesc
 * Layer source for the CartoDB Maps API.
 * @api
 */
class CartoDB extends XYZ {
  /**
   * @param {Options} options CartoDB options.
   */
  constructor(options) {
    super({
      attributions: options.attributions,
      cacheSize: options.cacheSize,
      crossOrigin: options.crossOrigin,
      maxZoom: options.maxZoom !== undefined ? options.maxZoom : 18,
      minZoom: options.minZoom,
      projection: options.projection,
      transition: options.transition,
      wrapX: options.wrapX,
      zDirection: options.zDirection,
    });

    /**
     * @type {string}
     * @private
     */
    this.account_ = options.account;

    /**
     * @type {string}
     * @private
     */
    this.mapId_ = options.map || '';

    /**
     * @type {!Object}
     * @private
     */
    this.config_ = options.config || {};

    /**
     * @type {!Object<string, CartoDBLayerInfo>}
     * @private
     */
    this.templateCache_ = {};

    this.initializeMap_();
  }

  /**
   * Returns the current config.
   * @return {!Object} The current configuration.
   * @api
   */
  getConfig() {
    return this.config_;
  }

  /**
   * Updates the carto db config.
   * @param {Object} config a key-value lookup. Values will replace current values
   *     in the config.
   * @api
   */
  updateConfig(config) {
    assign(this.config_, config);
    this.initializeMap_();
  }

  /**
   * Sets the CartoDB config
   * @param {Object} config In the case of anonymous maps, a CartoDB configuration
   *     object.
   * If using named maps, a key-value lookup with the template parameters.
   * @api
   */
  setConfig(config) {
    this.config_ = config || {};
    this.initializeMap_();
  }

  /**
   * Issue a request to initialize the CartoDB map.
   * @private
   */
  initializeMap_() {
    const paramHash = JSON.stringify(this.config_);
    if (this.templateCache_[paramHash]) {
      this.applyTemplate_(this.templateCache_[paramHash]);
      return;
    }
    let mapUrl = 'https://' + this.account_ + '.carto.com/api/v1/map';

    if (this.mapId_) {
      mapUrl += '/named/' + this.mapId_;
    }

    const client = new XMLHttpRequest();
    client.addEventListener(
      'load',
      this.handleInitResponse_.bind(this, paramHash)
    );
    client.addEventListener('error', this.handleInitError_.bind(this));
    client.open('POST', mapUrl);
    client.setRequestHeader('Content-type', 'application/json');
    client.send(JSON.stringify(this.config_));
  }

  /**
   * Handle map initialization response.
   * @param {string} paramHash a hash representing the parameter set that was used
   *     for the request
   * @param {Event} event Event.
   * @private
   */
  handleInitResponse_(paramHash, event) {
    const client = /** @type {XMLHttpRequest} */ (event.target);
    // status will be 0 for file:// urls
    if (!client.status || (client.status >= 200 && client.status < 300)) {
      let response;
      try {
        response = /** @type {CartoDBLayerInfo} */ (
          JSON.parse(client.responseText)
        );
      } catch (err) {
        this.setState(SourceState.ERROR);
        return;
      }
      this.applyTemplate_(response);
      this.templateCache_[paramHash] = response;
      this.setState(SourceState.READY);
    } else {
      this.setState(SourceState.ERROR);
    }
  }

  /**
   * @private
   * @param {Event} event Event.
   */
  handleInitError_(event) {
    this.setState(SourceState.ERROR);
  }

  /**
   * Apply the new tile urls returned by carto db
   * @param {CartoDBLayerInfo} data Result of carto db call.
   * @private
   */
  applyTemplate_(data) {
    const tilesUrl =
      'https://' +
      data.cdn_url.https +
      '/' +
      this.account_ +
      '/api/v1/map/' +
      data.layergroupid +
      '/{z}/{x}/{y}.png';
    this.setUrl(tilesUrl);
  }
}

export default CartoDB;
