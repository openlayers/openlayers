import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import BingMaps from '../src/ol/source/BingMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Fill, Style, Text} from '../src/ol/style.js';

const style = new Style({
  text: new Text({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new Fill({
      color: 'white'
    })
  })
});

const viewExtent = [1817379, 6139595, 1827851, 6143616];
const map = new Map({
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
    center: getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});
