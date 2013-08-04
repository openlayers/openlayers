goog.provide('ol.source.Acetate');

goog.require('goog.asserts');
goog.require('ol.Attribution');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');


/**
 * @type {Object.<string, {extension: string, opaque: boolean}>}
 */
ol.source.AcetateLayerConfig = {
  'acetate-base': {
    extension: 'png',
    opaque: false
  },
  'acetate-fg': {
    extension: 'png',
    opaque: false
  },
  'acetate-hillshading': {
    extension: 'png',
    opaque: false
  },
  'acetate-labels': {
    extension: 'png',
    opaque: false
  },
  'acetate-roads': {
    extension: 'png',
    opaque: false
  },
  'hillshading': {
    extension: 'png',
    opaque: false
  },
  'terrain': {
    extension: 'png',
    opaque: false
  }
};


/**
 * @type {Object.<string, {minZoom: number, maxZoom: number}>}
 */
ol.source.AcetateProviderConfig = {
  'acetate-base': {
    minZoom: 2,
    maxZoom: 7
  },
  'acetate-fg': {
    minZoom: 1,
    maxZoom: 17
  },
  'acetate-hillshading': {
    minZoom: 0,
    maxZoom: 18
  },
  'acetate-labels': {
    minZoom: 1,
    maxZoom: 15
  },
  'acetate-roads': {
    minZoom: 9,
    maxZoom: 17
  },
  'hillshading': {
    minZoom: 0,
    maxZoom: 9
  },
  'terrain': {
    minZoom: 0,
    maxZoom: 20
  }
};


/**
 * @const {Array.<ol.Attribution>}
 */
ol.source.ACETATE_ATTRIBUTIONS = [
  new ol.Attribution(
      'Map tiles by  by <a href="http://www.esri.com">ESRI</a> and ' +
      '<a href="http://stamen.com">Stamen Design</a>, under ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.5/">' +
      'CC BY-SA 2.5</a>.'),
  ol.source.OSM.DATA_ATTRIBUTION
];



/**
 * @constructor
 * @extends {ol.source.XYZ}
 * @param {ol.source.AcetateOptions} options Acetate options.
 */
ol.source.Acetate = function(options) {

  goog.asserts.assert(options.layer in ol.source.AcetateProviderConfig);
  var providerConfig = ol.source.AcetateProviderConfig[options.layer];

  goog.asserts.assert(options.layer in ol.source.AcetateLayerConfig);
  var layerConfig = ol.source.AcetateLayerConfig[options.layer];

  var url = goog.isDef(options.url) ? options.url :
      'http://{a-d}.acetate.geoiq.com/tiles/' + options.layer +
      '/{z}/{x}/{y}.' + layerConfig.extension;

  goog.base(this, {
    attributions: ol.source.ACETATE_ATTRIBUTIONS,
    crossOrigin: null,
    maxZoom: providerConfig.maxZoom,
    minZoom: providerConfig.minZoom,
    opaque: layerConfig.opaque,
    url: url
  });

};
goog.inherits(ol.source.Acetate, ol.source.XYZ);
