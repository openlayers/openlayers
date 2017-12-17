import _ol_Feature_ from '../src/ol/Feature.js';
import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Circle from '../src/ol/geom/Circle.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var image = new _ol_style_Circle_({
  radius: 5,
  fill: null,
  stroke: new _ol_style_Stroke_({color: 'red', width: 1})
});

var styles = {
  'Point': new _ol_style_Style_({
    image: image
  }),
  'LineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'green',
      width: 1
    })
  }),
  'MultiLineString': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'green',
      width: 1
    })
  }),
  'MultiPoint': new _ol_style_Style_({
    image: image
  }),
  'MultiPolygon': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'yellow',
      width: 1
    }),
    fill: new _ol_style_Fill_({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  }),
  'Polygon': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'blue',
      lineDash: [4],
      width: 3
    }),
    fill: new _ol_style_Fill_({
      color: 'rgba(0, 0, 255, 0.1)'
    })
  }),
  'GeometryCollection': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'magenta',
      width: 2
    }),
    fill: new _ol_style_Fill_({
      color: 'magenta'
    }),
    image: new _ol_style_Circle_({
      radius: 10,
      fill: null,
      stroke: new _ol_style_Stroke_({
        color: 'magenta'
      })
    })
  }),
  'Circle': new _ol_style_Style_({
    stroke: new _ol_style_Stroke_({
      color: 'red',
      width: 2
    }),
    fill: new _ol_style_Fill_({
      color: 'rgba(255,0,0,0.2)'
    })
  })
};

var styleFunction = function(feature) {
  return styles[feature.getGeometry().getType()];
};

var geojsonObject = {
  'type': 'FeatureCollection',
  'crs': {
    'type': 'name',
    'properties': {
      'name': 'EPSG:3857'
    }
  },
  'features': [{
    'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [0, 0]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [[4e6, -2e6], [8e6, 2e6]]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'LineString',
      'coordinates': [[4e6, 2e6], [8e6, -2e6]]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[[-5e6, -1e6], [-4e6, 1e6], [-3e6, -1e6]]]
    }
  }, {
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
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'MultiPolygon',
      'coordinates': [
        [[[-5e6, 6e6], [-5e6, 8e6], [-3e6, 8e6], [-3e6, 6e6]]],
        [[[-2e6, 6e6], [-2e6, 8e6], [0, 8e6], [0, 6e6]]],
        [[[1e6, 6e6], [1e6, 8e6], [3e6, 8e6], [3e6, 6e6]]]
      ]
    }
  }, {
    'type': 'Feature',
    'geometry': {
      'type': 'GeometryCollection',
      'geometries': [{
        'type': 'LineString',
        'coordinates': [[-5e6, -5e6], [0, -5e6]]
      }, {
        'type': 'Point',
        'coordinates': [4e6, -5e6]
      }, {
        'type': 'Polygon',
        'coordinates': [[[1e6, -6e6], [2e6, -4e6], [3e6, -6e6]]]
      }]
    }
  }]
};

var vectorSource = new _ol_source_Vector_({
  features: (new GeoJSON()).readFeatures(geojsonObject)
});

vectorSource.addFeature(new _ol_Feature_(new Circle([5e6, 7e6], 1e6)));

var vectorLayer = new _ol_layer_Vector_({
  source: vectorSource,
  style: styleFunction
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    }),
    vectorLayer
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});
