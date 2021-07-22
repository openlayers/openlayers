import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';
import {fromLonLat} from '../src/ol/proj.js';
import KML from '../src/ol/format/KML.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Vector as VectorLayer} from '../src/ol/layer.js';


const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/KrasnayaPolyanaResort.kml',
    format: new KML()
  })
});

const map = new Map({
  layers: [
    new TileLayer({ 
      source: new OSM()
    }), vector
  ], 
  target: 'map',
  view: new View({
    center: fromLonLat([40.254,43.664]),
    zoom: 16
  })
});
