goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Expression');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.filter.Filter');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Vector');
goog.require('ol.projection');
goog.require('ol.source.Vector');
goog.require('ol.style.Line');
goog.require('ol.style.Rule');
goog.require('ol.style.Style');


var source = new ol.source.Vector({
  projection: ol.projection.getFromCode('EPSG:3857')
});

source.addFeatures([
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, -10000000], [10000000, 10000000]]),
    'color': '#BADA55',
    'where': 'inner'
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, 10000000], [10000000, -10000000]]),
    'color': '#BADA55',
    'where': 'inner'
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, -10000000], [-10000000, 10000000]]),
    'color': '#013',
    'where': 'outer'
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[-10000000, 10000000], [10000000, 10000000]]),
    'color': '#013',
    'where': 'outer'
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[10000000, 10000000], [10000000, -10000000]]),
    'color': '#013',
    'where': 'outer'
  }),
  new ol.Feature({
    g: new ol.geom.LineString([[10000000, -10000000], [-10000000, -10000000]]),
    'color': '#013',
    'where': 'outer'
  })
]);

var style = new ol.style.Style({
  rules: [
    new ol.style.Rule({
      filter: new ol.filter.Filter(function(feature) {
        return feature.get('where') == 'outer';
      }),
      symbolizers: [
        new ol.style.Line({
          strokeStyle: new ol.Expression('color'),
          strokeWidth: 4,
          opacity: 1
        })
      ]
    }),
    new ol.style.Rule({
      filter: new ol.filter.Filter(function(feature) {
        return feature.get('where') == 'inner';
      }),
      symbolizers: [
        new ol.style.Line({
          strokeStyle: '#013',
          strokeWidth: 4,
          opacity: 1
        }),
        new ol.style.Line({
          strokeStyle: new ol.Expression('color'),
          strokeWidth: 2,
          opacity: 1
        })
      ]
    })
  ]
});

var vector = new ol.layer.Vector({
  source: source,
  style: style
});

var map = new ol.Map({
  layers: new ol.Collection([vector]),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
