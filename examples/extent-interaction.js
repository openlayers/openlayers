import ExtentInteraction from '../src/ol/interaction/Extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {shiftKeyOnly} from '../src/ol/events/condition.js';

const vectorSource = new VectorSource({
  url: 'data/geojson/countries.geojson',
  format: new GeoJSON(),
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const extent = new ExtentInteraction({condition: shiftKeyOnly});
map.addInteraction(extent);
