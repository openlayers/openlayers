import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {getVectorContext} from '../src/ol/render.js';

const base = new TileLayer({
  source: new OSM(),
});

const clipLayer = new VectorLayer({
  style: new Style({
    fill: new Fill({
      color: 'black',
    }),
  }),
  source: new VectorSource({
    url: './data/geojson/switzerland.geojson',
    format: new GeoJSON(),
  }),
});

clipLayer.on('prerender', function (e) {
  e.context.globalCompositeOperation = 'destination-in';
});

clipLayer.on('postrender', function (e) {
  e.context.globalCompositeOperation = 'source-over';
});

const map = new Map({
  layers: [base, clipLayer],
  target: 'map',
  view: new View({
    center: fromLonLat([8.23, 46.86]),
    zoom: 7,
  }),
});
