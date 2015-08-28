goog.provide('ga.layer');
goog.provide('ga.source.wms');
goog.provide('ga.source.wmts');

goog.require('ga.style.StylesFromLiterals');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('goog.json');
goog.require('ol.Attribution');
goog.require('ol.format.GeoJSON');
goog.require('ol.source.Vector');
goog.require('ol.layer.Group');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Image');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileWMS');
goog.require('ol.source.ImageWMS');
goog.require('ol.source.WMTS');
goog.require('ol.tilegrid.WMTS');

/**
 * Create an GeoAdmin layer using the geoadmin bod-id you
 * may find on [Which layers are available](http://api3.geo.admin.ch/api/faq/index.html#which-layers-are-available)
 * @example
 *  var lyr = ga.layer.create('ch.swisstopo.pixelkarte-farbe')
 *  var lyr1 = ga.layer.create('ch.swisstopo.lubis-luftbilder_farbe', {timestamp: '19901231'})
 * @method
 * @param {string} layer Geoadmin layer id.
 * @param {Object=} options Optional layer options (used in order to overide options defined in the layer configuration).
 * @return {ol.layer.Group|ol.layer.Image|ol.layer.Tile|ol.layer.Vector|undefined}
 * @api stable
 */
ga.layer.create = function(layer, options) {
  if (layer in ga.layer.layerConfig) {
    var layerConfig = ga.layer.layerConfig[layer];

    if (options) {
      goog.object.extend(layerConfig, options);
    }

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
          source: ga.source.wms(layer, layerConfig),
          useInterimTilesOnError: false
        });
      }     
    } else if (layerConfig.type == 'wmts') {
      olLayer = new ol.layer.Tile({
        minResolution: layerConfig.minResolution,
        maxResolution: layerConfig.maxResolution,
        opacity: layerConfig.opacity,
        source: ga.source.wmts(layer, layerConfig),
        useInterimTilesOnError: false
      });
    } else if (layerConfig.type == 'geojson') {
      var geojsonFormat = new ol.format.GeoJSON();
      var olSource = new ol.source.Vector();
      olLayer = new ol.layer.Vector({
        source: olSource
      });
      var setLayerStyle = function() {
        var xhrIo = new goog.net.XhrIo;
        xhrIo.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
        goog.events.listenOnce(xhrIo, goog.net.EventType.COMPLETE,
          function(event) {
            var source = goog.json.parse(xhrIo.getResponseText());
            var olStyleForVector = new ga.style.StylesFromLiterals(source);
            olLayer.setStyle(function(feature) {
              return [olStyleForVector.getFeatureStyle(feature)];
            });
            xhrIo.dispose();
          }
        );
        xhrIo.send(layerConfig['styleUrl'], 'GET');
      };
      var setLayerSource = function() {
        var xhrIo = new goog.net.XhrIo;
        xhrIo.setResponseType(goog.net.XhrIo.ResponseType.TEXT);
        goog.events.listenOnce(xhrIo, goog.net.EventType.COMPLETE,
          function(event) {
            var source = xhrIo.getResponseText();
            olSource.clear();
            olSource.addFeatures(geojsonFormat.readFeatures(source));
            xhrIo.dispose();
          }
        );
        xhrIo.send(layerConfig['geojsonUrl'], 'GET');
      };
      setLayerStyle();
      setLayerSource();
    }
  }
  Object.defineProperties(Object(olLayer), {
    id: {
      get: function() {
        return layer;
      }
    },
    hasLegend: {
      get: function() {
        return layerConfig['hasLegend'];
      }
    },
    highlighable: {
      get: function() {
        return layerConfig['highlighable'];
      }
    },
    label: {
      get: function() {
        return layerConfig['label'];
      }
    },
    tooltip: {
      get: function() {
        return layerConfig['tooltip'];
      }
    },
    searchable: {
      get: function() {
        return layerConfig['searchable'];
      }
    },
    geojsonUrl: {
      get: function() {
        return layerConfig['geojsonUrl'];
      }
    },
    styleUrl: {
      get: function() {
        return layerConfig['styleUrl'];
      }
    },
    updateDelay: {
      get: function() {
        return layerConfig['updateDelay'];
      }
    },
    timeEnabled: {
      get: function() {
        return layerConfig['timeEnabled'];
      }     
    },
    timestamps: {
      get: function() {
        return layerConfig['timestamps'];
      }
    },
    time: {
      get: function() {
        if (olLayer instanceof ol.layer.Layer) {
          var src = olLayer.getSource();
          if (src instanceof ol.source.WMTS) {
            return src.getDimensions().Time;
          } else if (src instanceof ol.source.ImageWMS ||
            src instanceof ol.source.TileWMS) {
            return src.getParams().TIME;
          }
        }
        return undefined;
      },
      set: function(val) {
        if (olLayer instanceof ol.layer.Layer) {
          var src = olLayer.getSource();
          if (src instanceof ol.source.WMTS) {
            src.updateDimensions({'Time': val});
          } else if (src instanceof ol.source.ImageWMS ||
              src instanceof ol.source.TileWMS) {
            src.updateParams({'TIME': val});
          }
          olLayer.set('time', val);
        }
      }
    },
    //[''] annotation is not allowed within
    //compiled code on struct definitions. Therfore,
    //we create those internal properties, which
    //can be used inside compiled code (see
    //tooltip for an example)
    internal_id: {
      get: function() {
        return layer;
      }
    },
    internal_tooltip: {
      get: function() {
        return layerConfig['tooltip'];
      }
    }
  });
  return olLayer;
};

/**
 * @type {Object.<string, Object>}
 */
ga.layer.layerConfig = (window.GeoAdmin) ? GeoAdmin.getConfig() : {};

/**
 * @type {Object.<string, Object>}
 */
ga.layer.attributions = {};

/**
 * Get the attribution 
 * @method
 * @param {string} text id of the Datenherr, i.e. 'ch.swisstopo'
 * @return {Object|null}
 */
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
 * Create a WMTS source given a bod layer id
 * 
 * @method
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
  var timestamp = options['timestamp'] ? options['timestamp'] : options['timestamps'][0];
  return new ol.source.WMTS( /** @type {olx.source.WMTSOptions} */({
    crossOrigin: 'anonymous',
    attributions: [
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    url: ('http://wmts{5-9}.geo.admin.ch/1.0.0/{Layer}/default/{Time}/21781/' +
        '{TileMatrix}/{TileRow}/{TileCol}.').replace('http:',location.protocol) + extension,
    tileGrid: tileGrid,
    layer: options['serverLayerName'] ? options['serverLayerName'] : layer,
    requestEncoding: 'REST',
    dimensions: {
      'Time': timestamp
    }
  }));
};


/**
 * Create a tiled WMS source given a bod layer id
 * 
 * @method
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.TileWMS}
 */
ga.source.wms = function(layer, options) {
  return new ol.source.TileWMS({
    crossOrigin: 'anonymous',
    wrapX: false,
    gutter: options['gutter'] || 0,
    attributions: [
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    params: {
      'LAYERS': options['wmsLayers'] || layer,
      'TIME': options['timestamp']
    },
    url: options['wmsUrl'].split('?')[0].replace('http:',location.protocol)
  });
};

/**
 * Create a single tile WMS source given a bod layer id
 * 
 * @method
 * @param {string} layer layer id.
 * @param {Object} options source options.
 * @return {ol.source.ImageWMS}
 */
ga.source.imageWms = function(layer, options) {
  return new ol.source.ImageWMS({
    crossOrigin: 'anonymous',
    attributions: [
      ga.layer.getAttribution('<a href="' +
        options['attributionUrl'] +
        '" target="new">' +
        options['attribution'] + '</a>')
    ],
    params: {
      'LAYERS': options['wmsLayers'] || layer,
      'TIME': options['timestamp']
    },
    ratio: 1,
    url: options['wmsUrl'].split('?')[0].replace('http:',location.protocol)
  });
};
