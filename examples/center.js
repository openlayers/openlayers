import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const source = new VectorSource({
  url: 'data/geojson/switzerland.geojson',
  format: new GeoJSON(),
});

const vectorLayer = new VectorLayer({
  source: source,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.6)',
    'stroke-width': 1,
    'stroke-color': '#319FD3',
    'circle-radius': 5,
    'circle-fill-color': 'rgba(255, 255, 255, 0.6)',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#319FD3',
  },
});

const view = new View({
  center: [0, 0],
  zoom: 1,
});
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  target: 'map',
  view: view,
});

const zoomtoswitzerland = document.getElementById('zoomtoswitzerland');
zoomtoswitzerland.addEventListener(
  'click',
  function () {
    const feature = source.getFeatures()[0];
    const polygon = feature.getGeometry();
    view.fit(polygon, {padding: [170, 50, 30, 150]});
  },
  false
);

const zoomtolausanne = document.getElementById('zoomtolausanne');
zoomtolausanne.addEventListener(
  'click',
  function () {
    const feature = source.getFeatures()[1];
    const point = feature.getGeometry();
    view.fit(point, {padding: [170, 50, 30, 150], minResolution: 50});
  },
  false
);

const centerlausanne = document.getElementById('centerlausanne');
centerlausanne.addEventListener(
  'click',
  function () {
    const feature = source.getFeatures()[1];
    const point = feature.getGeometry();
    const size = map.getSize();
    view.centerOn(point.getCoordinates(), size, [570, 500]);
  },
  false
);
