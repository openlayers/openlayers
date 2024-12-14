import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ImageLayer from '../src/ol/layer/Image.js';
import TileLayer from '../src/ol/layer/Tile.js';
import ImageArcGISRest from '../src/ol/source/ImageArcGISRest.js';
import OSM from '../src/ol/source/OSM.js';

const url =
  'https://sampleserver6.arcgisonline.com/ArcGIS/rest/services/' +
  'USA/MapServer';

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
