goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.proj');
goog.require('ol.source.Vector');

goog.provide('ol.source.XAPI');



/**
 * @constructor
 * @extends {ol.source.Vector}
 * @param {ol.source.XAPIoptions} options Vector source options.
 */
ol.source.XAPI = function(options) {

  this.setUrl(goog.isDef(options.url) ?
      options.url : 'http://xapi.openstreetmap.org/api/0.6/');

  /**
   * url of openstreetmap xapi service
   * @type {goog.Uri|undefined|string}
   */
  this.url = this.getUrl();

  /**
   * type on of 'node', 'way', 'relation', or '*'
   * @type {Object.<string>}
   */
  this.type = goog.isDef(options.type) ? options.type : '*';

  /**
   * aditional parameters according to XAPI interface
   * @type {Object}
   */
  this.params = goog.isDef(options.params) ? options.params : {};

  goog.base(this, options);

};
goog.inherits(ol.source.XAPI, ol.source.Vector);


/**
 * @param {ol.layer.Vector} layer Layer that parses the data.
 * @param {ol.Extent} extent Extent that needs to be fetched.
 * @param {ol.Projection} projection Projection of the view.
 * @param {function()=} opt_callback Callback which is called when features are
 *     parsed after loading.
 * @return {ol.source.VectorLoadState} The current load state.
 */
ol.source.XAPI.prototype.prepareFeatures = function(layer, extent, projection,
    opt_callback) {

  // transform coordinates, if needed
  if (projection && projection.getCode() !== 'EPSG:4326') {
    extent = ol.proj.transform(extent, projection, 'EPSG:4326');
  }
  // parepare this.url_ first, than run prepareFeatures from parent class
  this.setUrl(this.getFeaturesUrl(extent, this.params, this.type));
  return ol.source.XAPI.superClass_.prepareFeatures.call(this,
      layer, extent, projection, opt_callback);
};


/**
 * Creates url used for xapi query
 * @param {ol.Extent} extent Extent that needs to be fetched.
 * @param {Object.<string, string|number>} params Request parameters.
 * @param {Object.<string>} type on of 'node', 'way', 'relation', or '*'
 * @return {string} WMS GetMap request URL.
 */
ol.source.XAPI.prototype.getFeaturesUrl = function(extent, params, type) {

  params = params || {};
  type = type || this.type;
  type = type || this.type;
  var baseParams = {};
  var bboxValues = [extent[0], extent[1], extent[2], extent[3]];
  var i;
  var query_array = [];
  var query;

  baseParams.bbox = bboxValues.join(',');
  goog.object.extend(baseParams, params);

  for (i in baseParams) {
    query_array.push(
        goog.string.buildString('[', i, '=', baseParams[i], ']'));
  }
  query = goog.string.escapeString(
      goog.string.buildString.apply(this, query_array));

  return goog.string.buildString(this.url, type, query);
};
