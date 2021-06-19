import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import TileDebug from '../src/ol/source/TileDebug.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1,
  }),
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
  }),
});

const vtLayer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    maxZoom: 15,
    format: new MVT(),
    url:
      'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
      'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
  }),
  style: function (feature) {
    style.getText().setText(feature.get('name'));
    return style;
  },
});

const debugLayer = new TileLayer({
  source: new TileDebug({
    template: 'z:{z} x:{x} y:{-y}',
    projection: vtLayer.getSource().getProjection(),
    tileGrid: vtLayer.getSource().getTileGrid(),
    zDirection: 1,
  }),
});

const map = new Map({
  layers: [vtLayer, debugLayer],
  target: 'map',
  view: new View({
    center: [0, 6000000],
    zoom: 4,
  }),
});
