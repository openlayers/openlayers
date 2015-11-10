goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var styleFunction = (function() {
  var styles = {};
  var image = new ol.style.Circle({
    radius: 5,
    fill: null,
    stroke: new ol.style.Stroke({color: 'orange', width: 2})
  });
  styles['Point'] = [new ol.style.Style({image: image})];
  styles['Polygon'] = [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'blue',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  })];
  styles['MultiLinestring'] = [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 3
    })
  })];
  styles['MultiPolygon'] = [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })];
  styles['default'] = [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 0, 0, 0.1)'
    }),
    image: image
  })];
  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()] || styles['default'];
  };
})();

var geojsonObject = {
  'type': 'FeatureCollection',
  'crs': {
    'type': 'name',
    'properties': {
      'name': 'EPSG:3857'
    }
  },
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
        'type': 'MultiPoint',
        'coordinates': [[-2e6, 0], [0, -2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[4e6, -2e6], [8e6, 2e6], [9e6, 2e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': [[4e6, -2e6], [8e6, 2e6], [8e6, 3e6]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [[[-5e6, -1e6], [-4e6, 1e6],
            [-3e6, -1e6], [-5e6, -1e6]], [[-4.5e6, -0.5e6],
            [-3.5e6, -0.5e6], [-4e6, 0.5e6], [-4.5e6, -0.5e6]]]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'MultiLineString',
        'coordinates': [
          [[-1e6, -7.5e5], [-1e6, 7.5e5]],
          [[-1e6, -7.5e5], [-1e6, 7.5e5], [-5e5, 0], [-1e6, -7.5e5]],
          [[1e6, -7.5e5], [15e5, 0], [15e5, 0], [1e6, 7.5e5]],
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
          [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6],
              [-3e6, 6e6], [-5e6, 6e6]]],
          [[[-3e6, 6e6], [-2e6, 8e6], [0, 8e6],
              [0, 6e6], [-3e6, 6e6]]],
          [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6],
              [3e6, 6e6], [1e6, 6e6]]]
        ]
      }
    },
    {
      'type': 'Feature',
      'geometry': {
        'type': 'GeometryCollection',
        'geometries': [
          {
            'type': 'LineString',
            'coordinates': [[-5e6, -5e6], [0, -5e6]]
          },
          {
            'type': 'Point',
            'coordinates': [4e6, -5e6]
          },
          {
            'type': 'Polygon',
            'coordinates': [
              [[1e6, -6e6], [2e6, -4e6], [3e6, -6e6], [1e6, -6e6]]
            ]
          }
        ]
      }
    }
  ]
};

var source = new ol.source.Vector({
  features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
});

var layer = new ol.layer.Vector({
  source: source,
  style: styleFunction
});

var overlayStyle = (function() {
  var styles = {};
  styles['Polygon'] = [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.5]
      })
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [255, 255, 255, 1],
        width: 5
      })
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [0, 153, 255, 1],
        width: 3
      })
    })
  ];
  styles['MultiPolygon'] = styles['Polygon'];

  styles['LineString'] = [
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [255, 255, 255, 1],
        width: 5
      })
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: [0, 153, 255, 1],
        width: 3
      })
    })
  ];
  styles['MultiLineString'] = styles['LineString'];

  styles['Point'] = [
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
          color: [0, 153, 255, 1]
        }),
        stroke: new ol.style.Stroke({
          color: [255, 255, 255, 0.75],
          width: 1.5
        })
      }),
      zIndex: 100000
    })
  ];
  styles['MultiPoint'] = styles['Point'];

  styles['GeometryCollection'] = styles['Polygon'].concat(styles['Point']);

  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
})();

var select = new ol.interaction.Select({
  style: overlayStyle
});

var modify = new ol.interaction.Modify({
  features: select.getFeatures(),
  style: overlayStyle
});

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, modify]),
  layers: [layer],
  target: 'map',
  view: new ol.View({
    center: [0, 1000000],
    zoom: 2
  })
});
