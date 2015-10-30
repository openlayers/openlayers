goog.provide('ol.source.CartoDB');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('ol.source.XYZ');


/**
 * @classdesc
 * Layer source for the CartoDB tiles.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.CartoDBOptions} options CartoDB options.
 * @api
 */
ol.source.CartoDB = function(options) {
  this.account_ = options.account;
  this.mapId_ = options.map || '';
  this.config_ = options.config || {};
  this.templateCache_ = {};
  delete options.map;
  goog.base(this, options);
  this.initializeMap_();
};
goog.inherits(ol.source.CartoDB, ol.source.XYZ);


/**
 * Returns the current config.
 * @return {Object} The current configuration.
 * @api
 */
ol.source.CartoDB.prototype.getConfig = function() {
  return this.config_;
};


/**
 * Updates the carto db config.
 * @param {Object} config a key-value lookup. Values will replace current values
 *     in the config.
 * @api
 */
ol.source.CartoDB.prototype.updateConfig = function(config) {
  for (var key in config) {
    this.config_[key] = config[key];
  }
  this.initializeMap_();
};


/**
 * Sets the CartoDB config
 * @param {Object} config In the case of anonymous maps, a CartoDB configuration
 *     object.
 * If using named maps, a key-value lookup with the template parameters.
 */
ol.source.CartoDB.prototype.setConfig = function(config) {
  this.config_ = config || {};
  this.initializeMap_();
};


/**
 * Issue a request to initialize the CartoDB map.
 * @private
 */
ol.source.CartoDB.prototype.initializeMap_ = function() {
  var paramHash = JSON.stringify(this.config_);
  if (this.templateCache_[paramHash]) {
    this.applyTemplate_(this.templateCache_[paramHash]);
    return;
  }
  var protocol = window.location.protocol;
  var mapUrl = protocol + '//' + this.account_ +
      '.cartodb.com/api/v1/map';

  if (this.mapId_) {
    mapUrl += '/named/' + this.mapId_;
  }

  var xhrIo = new goog.net.XhrIo();
  xhrIo.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
  xhrIo.setWithCredentials(false);
  goog.events.listen(xhrIo, goog.net.EventType.COMPLETE,
      this.handleInitResponse_.bind(this, paramHash));
  xhrIo.send(mapUrl,
      'POST',
      JSON.stringify(this.config_),
      {'Content-Type': 'application/json'});
};


/**
 * Handle map initialization response.
 * @param {string} paramHash a hash representing the parameter set that was used
 *     for the request
 * @param {Event} event Event.
 * @private
 */
ol.source.CartoDB.prototype.handleInitResponse_ = function(paramHash, event) {
  var xhrIo = event.target;
  goog.asserts.assertInstanceof(xhrIo, goog.net.XhrIo,
      'event.target/xhrIo is an instance of goog.net.XhrIo');
  var data = xhrIo.getResponseJson();
  if (xhrIo.isSuccess()) {
    this.applyTemplate_(data);
  }
  this.templateCache_[paramHash] = data;
};


/**
 * Apply the new tile urls returned by carto db
 * @param {Object} data Result of carto db call.
 * @private
 */
ol.source.CartoDB.prototype.applyTemplate_ = function(data) {
  var layerId = data['layergroupid'];
  var tilesUrl = 'https://' + data['cdn_url']['https'] + '/' + this.account_ +
      '/api/v1/map/' + layerId + '/{z}/{x}/{y}.png';
  this.setUrl(tilesUrl);
};
