import KML from '../src/ol/format/KML.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Vector as VectorLayer} from '../src/ol/layer.js';
import {unByKey} from '../src/ol/Observable.js';

const kml = new VectorSource({
  url: 'data/kml/KrasnayaPolyanaResort.kml',
  format: new KML(),
});

const vector = new VectorLayer({
  source: kml,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vector,
  ],
  target: 'map',
  view: new View({
    zoom: 16,
  }),
});

const listenerKey = kml.on('change', function (e) {
  if (e.target.getState() == 'ready') {
    map.getView().fit(e.target.getExtent(), map.getSize());
    unByKey(listenerKey);
  }
});
