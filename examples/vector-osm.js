import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_control_ from '../src/ol/control';
import _ol_format_OSMXML_ from '../src/ol/format/osmxml';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_loadingstrategy_ from '../src/ol/loadingstrategy';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Circle_ from '../src/ol/style/circle';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

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
  format: new _ol_format_OSMXML_(),
  loader: function(extent, resolution, projection) {
    var epsg4326Extent =
        _ol_proj_.transformExtent(extent, projection, 'EPSG:4326');
    var client = new XMLHttpRequest();
    client.open('POST', 'https://overpass-api.de/api/interpreter');
    client.addEventListener('load', function() {
      var features = new _ol_format_OSMXML_().readFeatures(client.responseText, {
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

var raster = new _ol_layer_Tile_({
  source: new _ol_source_BingMaps_({
    imagerySet: 'Aerial',
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5'
  })
});

map = new _ol_Map_({
  layers: [raster, vector],
  target: document.getElementById('map'),
  controls: _ol_control_.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new _ol_View_({
    center: [739218, 5906096],
    maxZoom: 19,
    zoom: 17
  })
});
