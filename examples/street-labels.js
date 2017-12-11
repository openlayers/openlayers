import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_extent_ from '../src/ol/extent.js';
import _ol_format_GeoJSON_ from '../src/ol/format/GeoJSON.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_layer_Vector_ from '../src/ol/layer/Vector.js';
import _ol_source_BingMaps_ from '../src/ol/source/BingMaps.js';
import _ol_source_Vector_ from '../src/ol/source/Vector.js';
import _ol_style_Fill_ from '../src/ol/style/Fill.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';

var style = new _ol_style_Style_({
  text: new _ol_style_Text_({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new _ol_style_Fill_({
      color: 'white'
    })
  })
});

var viewExtent = [1817379, 6139595, 1827851, 6143616];
var map = new _ol_Map_({
  layers: [new _ol_layer_Tile_({
    source: new _ol_source_BingMaps_({
      key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
      imagerySet: 'Aerial'
    })
  }), new _ol_layer_Vector_({
    declutter: true,
    source: new _ol_source_Vector_({
      format: new _ol_format_GeoJSON_(),
      url: 'data/geojson/vienna-streets.geojson'
    }),
    style: function(feature) {
      style.getText().setText(feature.get('name'));
      return style;
    }
  })],
  target: 'map',
  view: new _ol_View_({
    extent: viewExtent,
    center: _ol_extent_.getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});
