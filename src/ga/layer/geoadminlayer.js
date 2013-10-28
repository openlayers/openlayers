// FIXME: apply layer opacity from config.
// FIXME: single tile wms
goog.provide('ga.layer');
goog.provide('ga.source.wms');
goog.provide('ga.source.wmts');

goog.require('goog.array');
goog.require('ol.Attribution');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');


/**
 * Create a Geoadmin layer.
 * @param {string} layer Geoadmin layer id.
 * @return {ol.layer.Tile|ol.layer.Group} Layer instance.
 */
ga.layer.create = function(layer) {
  if (layer in ga.layer.GeoadminLayerConfig) {
    var layerConfig = ga.layer.GeoadminLayerConfig[layer];

    layerConfig.type = layerConfig.type || 'wmts';
    if (layerConfig.type == 'group') {
      var layers = [];
      for (var i = 0; i < layerConfig.layers.length; i++) {
        // FIXME
      }
      new ol.layer.Group({
        layers: layers
      });
    } else if (layerConfig.type == 'wms') {
      return new ol.layer.Tile({
        source: ga.source.wms(layer, layerConfig)
      });
    } else if (layerConfig.type == 'wmts') {
      return new ol.layer.Tile({
        source: ga.source.wmts(layer, layerConfig)
      });
    }
  }
  return null;
};


/**
 * @type {Object.<string, Object>}
 */
ga.layer.GeoadminLayerConfig = {
  // 'defaults': {
  //   attribution: 'swisstopo',
  //   format: 'image/png',
  //   minZoom: 0,
  //   maxZoom: 26,
  //   opaque: false,
  //   type: 'wmts'
  // },
  'ch.swisstopo.swissimage': {
    format: 'image/jpeg',
    times: [20130422, 20120809, 20120225, 20110914, 20110228],
    opaque: true,
    maxZoom: 27
  },
  'ch.swisstopo.pixelkarte-farbe': {
    format: 'image/jpeg',
    times: [20130213],
    opaque: true
  },
  'ch.bfe.kleinwasserkraftpotentiale': {
    attribution: 'OFEN',
    times: [20120531],
    opacity: 0.5
  },
  'ch.swisstopo.hiks-dufour': {
    times: [18450101, 19391231, 18441231],
    opaque: true,
    maxZoom: 26
  },
  'ch.bfe.sachplan-geologie-tiefenlager': {
    type: 'wms'
  },
  'ch.kantone.cadastralwebmap-farbe': {
    type: 'wms',
    layers: 'ch.swisstopo.swisstlm3d5D-karte-farbe.mapproxy,' +
        'ch.kantone.cadastralwebmap-farbe',
    format: 'image/jpeg'
  }
};


/**
 * @const {Array.<number>}
 */
ga.layer.RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25
];


/**
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.WMTS}
 */
ga.source.wmts = function(layer, options) {
  var resolutions = ga.layer.RESOLUTIONS.splice(
      options.minZoom || 0, (options.maxZoom || 26) + 1);
  var tileGrid = new ol.tilegrid.WMTS({
    origin: [420000, 350000],
    resolutions: resolutions,
    matrixIds: goog.array.range(resolutions.length)
  });
  var extension = (options.format || 'image/png').split('/')[1];
  return new ol.source.WMTS( /** @type {ol.source.WMTSOptions} */({
    opaque: goog.isDef(options.opaque) ? options.opaque : false,
    attributions: [
      new ol.Attribution({
        html: options.attribution || 'swisstopo'
      })
    ],
    url: 'http://wmts{0-4}.geo.admin.ch/1.0.0/{Layer}/default/{Time}/21781/' +
        '{TileMatrix}/{TileRow}/{TileCol}.' + extension,
    tileGrid: tileGrid,
    layer: layer,
    crossOrigin: 'anonymous',
    requestEncoding: 'REST',
    dimensions: {
      'Time': options.time || options.times[0]
    }
  }));
};


/**
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.TileWMS}
 */
ga.source.wms = function(layer, options) {
  return new ol.source.TileWMS({
    attributions: [
      new ol.Attribution({
        html: options.attribution || 'swisstopo'
      })
    ],
    crossOrigin: 'anonymous',
    opaque: goog.isDef(options.opaque) ? options.opaque : false,
    params: {
      'LAYERS': options.layers || layer
    },
    url: 'http://wms.geo.admin.ch/'
  });
};
