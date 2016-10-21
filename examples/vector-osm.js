goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.OSMXML');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.loadingstrategy');
goog.require('ol.proj');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

var map;

var styles = {
  'amenity': {
    'parking': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(170, 170, 170, 1.0)',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(170, 170, 170, 0.3)'
      })
    })
  },
  'building': {
    '.*': new ol.style.Style({
      zIndex: 100,
      stroke: new ol.style.Stroke({
        color: 'rgba(246, 99, 79, 1.0)',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(246, 99, 79, 0.3)'
      })
    })
  },
  'highway': {
    'service': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(255, 255, 255, 1.0)',
        width: 2
      })
    }),
    '.*': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(255, 255, 255, 1.0)',
        width: 3
      })
    })
  },
  'landuse': {
    'forest|grass|allotments': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(140, 208, 95, 1.0)',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: 'rgba(140, 208, 95, 0.3)'
      })
    })
  },
  'natural': {
    'tree': new ol.style.Style({
      image: new ol.style.Circle({
        radius: 2,
        fill: new ol.style.Fill({
          color: 'rgba(140, 208, 95, 1.0)'
        }),
        stroke: null
      })
    })
  }
};

var vectorSource = new ol.source.Vector({
  format: new ol.format.OSMXML(),
  loader: function(extent, resolution, projection) {
    var epsg4326Extent =
        ol.proj.transformExtent(extent, projection, 'EPSG:4326');
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');
    client.addEventListener('load', function() {
      var features = new ol.format.OSMXML().readFeatures(client.responseText, {
        featureProjection: map.getView().getProjection()
      });
      vectorSource.addFeatures(features);
    });
    var query = '(node(' +
        epsg4326Extent[1] + ',' + epsg4326Extent[0] + ',' +
        epsg4326Extent[3] + ',' + epsg4326Extent[2] +
        ');rel(bn)->.foo;way(bn);node(w)->.foo;rel(bw););out meta;';
    client.send(query);
  },
  strategy: ol.loadingstrategy.bbox
});

var vector = new ol.layer.Vector({
  source: vectorSource,
  style: function(feature) {
    for (var key in styles) {
      var value = feature.get(key);
      if (value !== undefined) {
        for (var regexp in styles[key]) {
          if (new RegExp(regexp).test(value)) {
            return styles[key][regexp];
          }
        }
      }
    }
    return null;
  }
});

var raster = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    imagerySet: 'Aerial',
    key: 'AkGbxXx6tDWf1swIhPJyoAVp06H0s0gDTYslNWWHZ6RoPqMpB9ld5FY1WutX8UoF'
  })
});

map = new ol.Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [739218, 5906096],
    maxZoom: 19,
    zoom: 17
  })
});
