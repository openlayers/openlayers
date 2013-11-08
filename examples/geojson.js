goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.reader');
goog.require('ol.reader.GeoJSON');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.DefaultStyleFunction');


var styleFunction = function(feature) {
  switch (feature.getGeometry().getType()) {
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      return {
        stroke: {
          color: 'green',
          width: 1
        }
      };
    case ol.geom.GeometryType.MULTI_POLYGON:
      return {
        stroke: {
          color: 'yellow',
          width: 1
        }
      };
    default:
      return ol.style.DefaultStyleFunction(feature);
  }
};

var features = ol.reader.readAllFromObject(ol.reader.GeoJSON.readObject, {
  'type': 'FeatureCollection',
  'features': [
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [0, 0]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[-1e7, -1e7], [1e7, 1e7]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[-1e7, 1e7], [1e7, -1e7]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[[-5e6, -5e6], [0, 5e6], [5e6, -5e6]]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'MultiLineString',
        'coordinates': [
          [[-1e6, -7.5e5], [-1e6, 7.5e5]],
          [[1e6, -7.5e5], [1e6, 7.5e5]],
          [[-7.5e5, -1e6], [7.5e5, -1e6]],
          [[-7.5e5, 1e6], [7.5e5, 1e6]]
        ]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'MultiPolygon',
        'coordinates': [
          [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
          [[[-2e6, 6e6], [-2e6, 8e6], [0e6, 8e6], [0e6, 6e6]]],
          [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
        ]
      }
    }
  ]
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        features: features
      }),
      styleFunction: styleFunction
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
