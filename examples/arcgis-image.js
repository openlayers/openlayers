import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {ImageArcGISRest, OSM} from '../src/ol/source.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';

const url =
  'https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/' +
  'Specialty/ESRI_StateCityHighway_USA/MapServer';

const layers = [
  new TileLayer({
    source: new OSM(),
  }),
  new ImageLayer({
    source: new ImageArcGISRest({
      ratio: 1,
      params: {},
      url: url,
    }),
  }),
];
const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
  }),
});
