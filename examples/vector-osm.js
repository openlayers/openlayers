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

var styles = {
  'amenity': {
    'parking': [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(170, 170, 170, 1.0)',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(170, 170, 170, 0.3)'
        })
      })
    ]
  },
  'building': {
    '.*': [
      new ol.style.Style({
        zIndex: 100,
        stroke: new ol.style.Stroke({
          color: 'rgba(246, 99, 79, 1.0)',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(246, 99, 79, 0.3)'
        })
      })
    ]
  },
  'highway': {
    'service': [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 1.0)',
          width: 2
        })
      })
    ],
    '.*': [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(255, 255, 255, 1.0)',
          width: 3
        })
      })
    ]
  },
  'landuse': {
    'forest|grass|allotments': [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(140, 208, 95, 1.0)',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(140, 208, 95, 0.3)'
        })
      })
    ]
  },
  'natural': {
    'tree': [
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2,
          fill: new ol.style.Fill({
            color: 'rgba(140, 208, 95, 1.0)'
          }),
          stroke: null
        })
      })
    ]
  }
};

var vectorSource = new ol.source.Vector({
  format: new ol.format.OSMXML(),
  url: function(extent, resolution, projection) {
    var epsg4326Extent =
        ol.proj.transformExtent(extent, projection, 'EPSG:4326');
    return 'http://overpass-api.de/api/xapi?map?bbox=' +
        epsg4326Extent.join(',');
  },
  strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
    maxZoom: 19
  }))
});

var vector = new ol.layer.Vector({
  source: vectorSource,
  style: function(feature, resolution) {
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
    key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3'
  })
});

var map = new ol.Map({
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
