goog.provide('ol.source.Stamen');

goog.require('goog.asserts');
goog.require('ol.Attribution');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');


/**
 * @type {Object.<string, {extension: string, opaque: boolean}>}
 */
ol.source.StamenLayerConfig = {
  'terrain': {
    extension: 'jpg',
    opaque: true
  },
  'terrain-background': {
    extension: 'jpg',
    opaque: true
  },
  'terrain-labels': {
    extension: 'png',
    opaque: false
  },
  'terrain-lines': {
    extension: 'png',
    opaque: false
  },
  'toner-background': {
    extension: 'png',
    opaque: true
  },
  'toner': {
    extension: 'png',
    opaque: true
  },
  'toner-hybrid': {
    extension: 'png',
    opaque: false
  },
  'toner-labels': {
    extension: 'png',
    opaque: false
  },
  'toner-lines': {
    extension: 'png',
    opaque: false
  },
  'toner-lite': {
    extension: 'png',
    opaque: true
  },
  'watercolor': {
    extension: 'jpg',
    opaque: true
  }
};


/**
 * @type {Object.<string, {minZoom: number, maxZoom: number}>}
 */
ol.source.StamenProviderConfig = {
  'terrain': {
    minZoom: 4,
    maxZoom: 18
  },
  'toner': {
    minZoom: 0,
    maxZoom: 20
  },
  'watercolor': {
    minZoom: 3,
    maxZoom: 16
  }
};



/**
 * @classdesc
 * Layer source for the Stamen tile server.
 *
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {olx.source.StamenOptions} options Stamen options.
 * @api stable
 */
ol.source.Stamen = function(options) {

  /**
   * url
   * @type {string}
   * @private
   */

  this.rootUrl_ = goog.isDef(options.url) ? options.url :
      'https://stamen-tiles-{a-d}.a.ssl.fastly.net/';

  /**
   * Layer
   * @type {string}
   * @private
   */
  this.layer_ = options.layer;

  goog.base(this, {
    attributions: ol.source.Stamen.ATTRIBUTIONS,
    crossOrigin: 'anonymous',
    tileLoadFunction: options.tileLoadFunction
  });
  this.setLayer(this.layer_);

};
goog.inherits(ol.source.Stamen, ol.source.XYZ);


/**
 * Set the Stamen Layer Source
 * Available layers are:
 *  'terrain', 'terrain-background', 'terrain-labels',
 *  'terrain-lines', 'toner-background', 'toner', 'toner-hybrid',
 *  'toner-labels', 'toner-lines', 'toner-lite' and 'watercolor'.
 * @param {string} layer The Stamen layer name
 * @api
 */
ol.source.Stamen.prototype.setLayer = function(layer) {

  this.layer_ = layer;

  var i = this.layer_.indexOf('-');
  var provider = i == -1 ? this.layer_ : this.layer_.slice(0, i);
  goog.asserts.assert(provider in ol.source.StamenProviderConfig,
      'known provider configured');
  var providerConfig = ol.source.StamenProviderConfig[provider];

  goog.asserts.assert(this.layer_ in ol.source.StamenLayerConfig,
      'known layer configured');
  var layerConfig = ol.source.StamenLayerConfig[this.layer_];

  var url = this.rootUrl_ +
      this.layer_ +
      '/{z}/{x}/{y}.' +
      layerConfig.extension;

  this.setUrl(url);
  this.set('maxZoom', providerConfig.maxZoom);
  // FIXME uncomment the following when tilegrid supports minZoom
  //this.set('minZoom',providerConfig.minZoom);
  this.set('opaque', layerConfig.opaque);
};


/**
 * Get the layer of the source.
 * @return {string} layer The Stamen layer name
 * @api
 */
ol.source.Stamen.prototype.getLayer = function() {
  return this.layer_;
};


/**
 * @const
 * @type {Array.<ol.Attribution>}
 */
ol.source.Stamen.ATTRIBUTIONS = [
  new ol.Attribution({
    html: 'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, ' +
        'under <a href="http://creativecommons.org/licenses/by/3.0/">CC BY' +
        ' 3.0</a>.'
  }),
  ol.source.OSM.ATTRIBUTION
];
