import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import OSMXML from '../src/ol/format/OSMXML.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_loadingstrategy_ from '../src/ol/loadingstrategy.js';
import {transformExtent} from '../src/ol/proj.js';
import _ol_source_BingMaps_ from '../src/ol/source/BingMaps.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Circle_ from '../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Stroke_ from '../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';

var map;

var styles = {
  'amenity': {
    'parking': new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'rgba(170, 170, 170, 1.0)',
        width: 1
      }),
      fill: new _ol_style_Fill_({
        color: 'rgba(170, 170, 170, 0.3)'
      })
    })
  },
  'building': {
    '.*': new _ol_style_Style_({
      zIndex: 100,
      stroke: new _ol_style_Stroke_({
        color: 'rgba(246, 99, 79, 1.0)',
        width: 1
      }),
      fill: new _ol_style_Fill_({
        color: 'rgba(246, 99, 79, 0.3)'
      })
    })
  },
  'highway': {
    'service': new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'rgba(255, 255, 255, 1.0)',
        width: 2
      })
    }),
    '.*': new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'rgba(255, 255, 255, 1.0)',
        width: 3
      })
    })
  },
  'landuse': {
    'forest|grass|allotments': new _ol_style_Style_({
      stroke: new _ol_style_Stroke_({
        color: 'rgba(140, 208, 95, 1.0)',
        width: 1
      }),
      fill: new _ol_style_Fill_({
        color: 'rgba(140, 208, 95, 0.3)'
      })
    })
  },
  'natural': {
    'tree': new _ol_style_Style_({
      image: new _ol_style_Circle_({
        radius: 2,
        fill: new _ol_style_Fill_({
          color: 'rgba(140, 208, 95, 1.0)'
        }),
        stroke: null
      })
    })
  }
};

var vectorSource = new _ol_source_Vector_({
  format: new OSMXML(),
  loader: function(extent, resolution, projection) {
    var epsg4326Extent = transformExtent(extent, projection, 'EPSG:4326');
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');
    client.addEventListener('load', function() {
      var features = new OSMXML().readFeatures(client.responseText, {
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
  strategy: _ol_loadingstrategy_.bbox
});

var vector = new _ol_layer_Vector_({
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

var raster = new TileLayer({
  source: new _ol_source_BingMaps_({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

map = new _ol_Map_({
  layers: [raster, vector],
  target: document.getElementById('map'),
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new _ol_View_({
    center: [739218, 5906096],
    maxZoom: 19,
    zoom: 17
  })
});
