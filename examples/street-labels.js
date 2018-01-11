import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import * as _ol_extent_ from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Style from '../src/ol/style/Style.js';
import _ol_style_Text_ from '../src/ol/style/Text.js';

var style = new Style({
  text: new _ol_style_Text_({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new Fill({
      color: 'white'
    })
  })
});

var viewExtent = [1817379, 6139595, 1827851, 6143616];
var map = new Map({
  layers: [new TileLayer({
    source: new BingMaps({
      key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
      imagerySet: 'Aerial'
    })
  }), new VectorLayer({
    declutter: true,
    source: new VectorSource({
      format: new GeoJSON(),
      url: 'data/geojson/vienna-streets.geojson'
    }),
    style: function(feature) {
      style.getText().setText(feature.get('name'));
      return style;
    }
  })],
  target: 'map',
  view: new View({
    extent: viewExtent,
    center: _ol_extent_.getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});
