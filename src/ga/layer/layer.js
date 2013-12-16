goog.provide('ga.layer');
goog.provide('ga.source.wms');
goog.provide('ga.source.wmts');

goog.require('goog.array');
goog.require('ol.Attribution');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Image');
goog.require('ol.source.TileWMS');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');

/**
 * Create an GeoAdmin layer using the geoadmin bod-id you
 * may find on [Which layers are available](http://api3.geo.admin.ch/api/faq/index.html#which-layers-are-available)
 * @example
 * 
 *  var lyr ga.layer.create('ch.swisstopo.pixelkarte-farbe')
 *  
 * @method
 * @param {string} layer Geoadmin layer id.
 * @return {ol.layer.Group|ol.layer.Image|ol.layer.Tile|undefined}
 */
ga.layer.create = function(layer) {
  if (layer in ga.layer.layerConfig) {
    var layerConfig = ga.layer.layerConfig[layer];

    layerConfig.type = layerConfig.type || 'wmts';

    var olLayer;

    if (layerConfig.type == 'aggregate') {
      var subLayers = [];
      for (var i = 0; i < layerConfig['subLayersIds'].length; i++) {
        subLayers[i] = ga.layer.create(layerConfig['subLayersIds'][i]);
      }
      olLayer = new ol.layer.Group({
        minResolution: layerConfig.minResolution,
        maxResolution: layerConfig.maxResolution,
        opacity: layerConfig.opacity,
        layers: subLayers
      });
    } else if (layerConfig.type == 'wms') {
      if (layerConfig['singleTile']) {
        olLayer = new ol.layer.Image({
          minResolution: layerConfig.minResolution,
          maxResolution: layerConfig.maxResolution,
          opacity: layerConfig.opacity,
          source: ga.source.imageWms(layer, layerConfig)
        });

      } else {
        olLayer = new ol.layer.Tile({
          minResolution: layerConfig.minResolution,
          maxResolution: layerConfig.maxResolution,
          opacity: layerConfig.opacity,
          source: ga.source.wms(layer, layerConfig)
        });
      }     
    } else if (layerConfig.type == 'wmts') {
      olLayer = new ol.layer.Tile({
        minResolution: layerConfig.minResolution,
        maxResolution: layerConfig.maxResolution,
        opacity: layerConfig.opacity,
        source: ga.source.wmts(layer, layerConfig)
      });
    }
  }
  Object.defineProperties(Object(olLayer), {
    'id': {
      get: function() {
        return layer;
      }
    },
    'hasLegend': {
      get: function() {
        return layerConfig['hasLegend'];
      }
    },
    'highlighable': {
      get: function() {
        return layerConfig['highlighable'];
      }
    },
    'label': {
      get: function() {
        return layerConfig['label'];
      }
    },
    'queryable': {
      get: function() {
        return layerConfig['queryable'];
      }
    },
    'searchable': {
      get: function() {
        return layerConfig['searchable'];
      }
    }
  });
  return olLayer;
};


/**
 * @type {Object.<string, Object>}
 */
ga.layer.layerConfig = getConfig() || {};

ga.layer.attributions = {};

ga.layer.getAttribution = function(text) {
  var key = text;
  if (key in ga.layer.attributions) {
    return ga.layer.attributions[key];
  } else {
    var a = new ol.Attribution({html: text});
    ga.layer.attributions[key] = a;
    return a;
  }
};


/**
 * @const {Array.<number>}
 */
ga.layer.RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5
];

/**
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.WMTS}
 */
ga.source.wmts = function(layer, options) {
  var resolutions = options.resolutions ? options.resolutions : ga.layer.RESOLUTIONS;
  var tileGrid = new ol.tilegrid.WMTS({
    origin: [420000, 350000],
    resolutions: resolutions,
    matrixIds: goog.array.range(resolutions.length)
  });
  var extension = options.format || 'png';
  var timestamp = options['timestamps'][0];
  return new ol.source.WMTS( /** @type {olx.source.WMTSOptions} */({
    attributions: [
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    url: 'http://wmts{0-4}.geo.admin.ch/1.0.0/{Layer}/default/'+
        timestamp + '/21781/' +
        '{TileMatrix}/{TileRow}/{TileCol}.'.replace('http:',location.protocol) + extension,
    tileGrid: tileGrid,
    layer: options['serverLayerName'] ? options['serverLayerName'] : layer,
    requestEncoding: 'REST'
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
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    params: {
      'LAYERS': options['wmsLayers'] || layer
    },
    url: options['wmsUrl'].split('?')[0].replace('http:',location.protocol)
  });
};

/**
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.ImageWMS}
 */
ga.source.imageWms = function(layer, options) {
  return new ol.source.ImageWMS({
    attributions: [
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    params: {
      'LAYERS': options['wmsLayers'] || layer
    },
    ratio: 1,
    url: options['wmsUrl'].split('?')[0].replace('http:',location.protocol)
  });
};
