/**
 * @module ol/source/CartoDB
 */
import {inherits} from '../index.js';
import {assign} from '../obj.js';
import SourceState from '../source/State.js';
import XYZ from '../source/XYZ.js';

/**
 * @classdesc
 * Layer source for the CartoDB Maps API.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.CartoDBOptions} options CartoDB options.
 * @api
 */
const CartoDB = function(options) {

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
   * @type {!Object.<string, CartoDBLayerInfo>}
   * @private
   */
  this.templateCache_ = {};

  XYZ.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    maxZoom: options.maxZoom !== undefined ? options.maxZoom : 18,
    minZoom: options.minZoom,
    projection: options.projection,
    state: SourceState.LOADING,
    wrapX: options.wrapX
  });
  this.initializeMap_();
};

inherits(CartoDB, XYZ);


/**
 * Returns the current config.
 * @return {!Object} The current configuration.
 * @api
 */
CartoDB.prototype.getConfig = function() {
  return this.config_;
};


/**
 * Updates the carto db config.
 * @param {Object} config a key-value lookup. Values will replace current values
 *     in the config.
 * @api
 */
CartoDB.prototype.updateConfig = function(config) {
  assign(this.config_, config);
  this.initializeMap_();
};


/**
 * Sets the CartoDB config
 * @param {Object} config In the case of anonymous maps, a CartoDB configuration
 *     object.
 * If using named maps, a key-value lookup with the template parameters.
 * @api
 */
CartoDB.prototype.setConfig = function(config) {
  this.config_ = config || {};
  this.initializeMap_();
};


/**
 * Issue a request to initialize the CartoDB map.
 * @private
 */
CartoDB.prototype.initializeMap_ = function() {
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
  client.addEventListener('load', this.handleInitResponse_.bind(this, paramHash));
  client.addEventListener('error', this.handleInitError_.bind(this));
  client.open('POST', mapUrl);
  client.setRequestHeader('Content-type', 'application/json');
  client.send(JSON.stringify(this.config_));
};


/**
 * Handle map initialization response.
 * @param {string} paramHash a hash representing the parameter set that was used
 *     for the request
 * @param {Event} event Event.
 * @private
 */
CartoDB.prototype.handleInitResponse_ = function(paramHash, event) {
  const client = /** @type {XMLHttpRequest} */ (event.target);
  // status will be 0 for file:// urls
  if (!client.status || client.status >= 200 && client.status < 300) {
    let response;
    try {
      response = /** @type {CartoDBLayerInfo} */(JSON.parse(client.responseText));
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
};


/**
 * @private
 * @param {Event} event Event.
 */
CartoDB.prototype.handleInitError_ = function(event) {
  this.setState(SourceState.ERROR);
};


/**
 * Apply the new tile urls returned by carto db
 * @param {CartoDBLayerInfo} data Result of carto db call.
 * @private
 */
CartoDB.prototype.applyTemplate_ = function(data) {
  const tilesUrl = 'https://' + data.cdn_url.https + '/' + this.account_ +
      '/api/v1/map/' + data.layergroupid + '/{z}/{x}/{y}.png';
  this.setUrl(tilesUrl);
};
export default CartoDB;
