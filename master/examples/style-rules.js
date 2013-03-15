var style = new ol.style.Style({rules: [
  new ol.style.Rule({
    filter: new ol.filter.Filter(function(feature) {
      return feature.get('where') == 'outer';
    }),
    symbolizers: [
      new ol.style.Line({
        strokeColor: new ol.Expression('color'),
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
        strokeColor: '#013',
        strokeWidth: 4,
        opacity: 1
      }),
      new ol.style.Line({
        strokeColor: new ol.Expression('color'),
        strokeWidth: 2,
        opacity: 1
      })
    ]
  })
]});

var vector = new ol.layer.Vector({
  style: style,
  source: new ol.source.Vector({
    projection: ol.projection.get('EPSG:3857')
  })
});

vector.parseFeatures({
  'type': 'FeatureCollection',
  'features': [{
    'type': 'Feature',
    'properties': {
      'color': '#BADA55',
      'where': 'inner'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[-10000000, -10000000], [10000000, 10000000]]
    }
  }, {
    'type': 'Feature',
    'properties': {
      'color': '#BADA55',
      'where': 'inner'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[-10000000, 10000000], [10000000, -10000000]]
    }
  }, {
    'type': 'Feature',
    'properties': {
      'color': '#013',
      'where': 'outer'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[-10000000, -10000000], [-10000000, 10000000]]
    }
  }, {
    'type': 'Feature',
    'properties': {
      'color': '#013',
      'where': 'outer'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[-10000000, 10000000], [10000000, 10000000]]
    }
  }, {
    'type': 'Feature',
    'properties': {
      'color': '#013',
      'where': 'outer'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[10000000, 10000000], [10000000, -10000000]]
    }
  }, {
    'type': 'Feature',
    'properties': {
      'color': '#013',
      'where': 'outer'
    },
    'geometry': {
      'type': 'LineString',
      'coordinates': [[10000000, -10000000], [-10000000, -10000000]]
    }
  }]
}, new ol.parser.GeoJSON(), ol.projection.get('EPSG:3857'));


var map = new ol.Map({
  layers: [vector],
  controls: ol.control.defaults({
    attribution: false
  }),
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 1
  })
});
