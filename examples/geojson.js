goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.DefaultStyleFunction');
goog.require('ol.symbol');


var image = ol.symbol.renderCircle(5, null, {color: 'red', width: 1});
var styleFunction = function(feature) {
  switch (feature.getGeometry().getType()) {
    case ol.geom.GeometryType.POINT:
      return {
        image: image
      };
    case ol.geom.GeometryType.POLYGON:
      return {
        stroke: {
          color: 'blue',
          width: 3
        },
        fill: {
          color: 'rgba(0, 0, 255, 0.1)'
        }
      };
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
        },
        fill: {
          color: 'rgba(255, 255, 0, 0.1)'
        }
      };
    default:
      return ol.style.DefaultStyleFunction(feature);
  }
};

var vectorSource = new ol.source.Vector();
new ol.format.GeoJSON().readObject({
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
        'coordinates': [[4e6, -2e6], [8e6, 2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[4e6, 2e6], [8e6, -2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
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
}, vectorSource.addFeature, vectorSource);

var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: styleFunction
});
var tmpFeature = new ol.Feature(
    new ol.geom.LineString([[-5e6, -5e6], [5e6, -5e6]]));
var tmpStyle = {
  fill: null,
  image: null,
  stroke: {
    color: 'magenta',
    width: 5
  }
};
vectorLayer.on('postrender', function(event) {
  var render = event.getRender();
  render.drawFeature(tmpFeature, tmpStyle);
  var context = event.getContext();
  if (!goog.isNull(context)) {
    context.clearRect(0, 0, 10, 10);
  }
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    vectorLayer
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
