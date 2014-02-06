goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.GeometryType');
goog.require('ol.interaction');
goog.require('ol.interaction.Modify');
goog.require('ol.interaction.Select');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.render.FeaturesOverlay');
goog.require('ol.source.GeoJSON');
goog.require('ol.source.MapQuest');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var raster = new ol.layer.Tile({
  style: 'Aerial',
  source: new ol.source.MapQuest({
    layer: 'sat'
  })
});

var image = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({color: 'red', width: 1})
});

var styleFunction = function(feature) {
  switch (feature.getGeometry().getType()) {
    case 'Point':
      return [new ol.style.Style({
        image: image
      })];
    case 'Polygon':
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'blue',
          width: 3
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 255, 0.1)'
        })
      })];
    case 'MultiLineString':
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'green',
          width: 1
        })
      })];
    case 'MultiPolygon':
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'yellow',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 0, 0.1)'
        })
      })];
    default:
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'red',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 0, 0, 0.1)'
        })
      })];
  }
};

var vectorSource = new ol.source.GeoJSON(
    /** @type {olx.source.GeoJSONOptions} */ ({
      object: {
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
              'type': 'LineString',
              'coordinates': [[4e6, -2e6], [8e6, 2e6]]
            }
          },
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Polygon',
              'coordinates': [[[-5e6, -1e6], [-4e6, 1e6],
                  [-3e6, -1e6], [-5e6, -1e6]]]
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
                [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6],
                    [-3e6, 6e6], [-5e6, 6e6]]],
                [[[-2e6, 6e6], [-2e6, 8e6], [0e6, 8e6],
                    [0e6, 6e6], [-2e6, 6e6]]],
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
                  'coordinates': [[-5e6, -5e6], [0e6, -5e6]]
                },
                {
                  'type': 'Point',
                  'coordinates': [4e6, -5e6]
                },
                {
                  'type': 'Polygon',
                  'coordinates': [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
                }
              ]
            }
          }
        ]
      }
    }));


var vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  styleFunction: styleFunction
});

var overlayStyle = (function() {
  /** @type {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} */
  var styles = {};
  styles[ol.geom.GeometryType.POLYGON] = [
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
  styles[ol.geom.GeometryType.MULTI_POLYGON] =
      styles[ol.geom.GeometryType.POLYGON];
  styles[ol.geom.GeometryType.GEOMETRY_COLLECTION] =
      styles[ol.geom.GeometryType.POLYGON];

  styles[ol.geom.GeometryType.LINE_STRING] = [
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
  styles[ol.geom.GeometryType.MULTI_LINE_STRING] =
      styles[ol.geom.GeometryType.LINE_STRING];

  styles[ol.geom.GeometryType.POINT] = [
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
  styles[ol.geom.GeometryType.MULTI_POINT] =
      styles[ol.geom.GeometryType.POINT];

  return function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
  };
})();

var overlay = new ol.render.FeaturesOverlay({
  styleFunction: overlayStyle
});

var modify = new ol.interaction.Modify({ featuresOverlay: overlay });
var select = new ol.interaction.Select({ featuresOverlay: overlay });

var map = new ol.Map({
  interactions: ol.interaction.defaults().extend([select, modify]),
  layers: [raster, vectorLayer],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});
