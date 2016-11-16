goog.provide('ol.source.Stamen');

goog.require('ol');
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
    minZoom: 1,
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

  var i = options.layer.indexOf('-');
  var provider = i == -1 ? options.layer : options.layer.slice(0, i);
  goog.DEBUG && console.assert(provider in ol.source.StamenProviderConfig,
      'known provider configured');
  var providerConfig = ol.source.StamenProviderConfig[provider];

  goog.DEBUG && console.assert(options.layer in ol.source.StamenLayerConfig,
      'known layer configured');
  var layerConfig = ol.source.StamenLayerConfig[options.layer];

  var url = options.url !== undefined ? options.url :
      'https://stamen-tiles-{a-d}.a.ssl.fastly.net/' + options.layer +
      '/{z}/{x}/{y}.' + layerConfig.extension;

  ol.source.XYZ.call(this, {
    attributions: ol.source.Stamen.ATTRIBUTIONS,
    cacheSize: options.cacheSize,
    crossOrigin: 'anonymous',
    maxZoom: options.maxZoom != undefined ? options.maxZoom : providerConfig.maxZoom,
    minZoom: options.minZoom != undefined ? options.minZoom : providerConfig.minZoom,
    opaque: layerConfig.opaque,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileLoadFunction: options.tileLoadFunction,
    url: url
  });

};
ol.inherits(ol.source.Stamen, ol.source.XYZ);


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
