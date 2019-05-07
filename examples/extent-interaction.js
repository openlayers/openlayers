import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import ExtentInteraction from '../src/ol/interaction/Extent.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';

const vectorSource = new VectorSource({
  url: 'data/geojson/countries.geojson',
  format: new GeoJSON()
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const extent = new ExtentInteraction();
map.addInteraction(extent);
extent.setActive(false);

//Enable interaction by holding shift
window.addEventListener('keydown', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(true);
  }
});
window.addEventListener('keyup', function(event) {
  if (event.keyCode == 16) {
    extent.setActive(false);
  }
});
