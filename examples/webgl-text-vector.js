import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {fromLonLat} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

// A small self-contained set of cities, in millions of inhabitants, tagged by
// continent so we can drive both the symbol and the label color from data.
const cities = [
  {name: 'London', lon: -0.13, lat: 51.51, continent: 'Europe', pop: 8.9},
  {name: 'Paris', lon: 2.35, lat: 48.86, continent: 'Europe', pop: 11},
  {name: 'Moscow', lon: 37.62, lat: 55.75, continent: 'Europe', pop: 12.6},
  {name: 'Tokyo', lon: 139.69, lat: 35.69, continent: 'Asia', pop: 37},
  {name: 'Delhi', lon: 77.21, lat: 28.61, continent: 'Asia', pop: 32},
  {name: 'Shanghai', lon: 121.47, lat: 31.23, continent: 'Asia', pop: 29},
  {name: 'Cairo', lon: 31.24, lat: 30.04, continent: 'Africa', pop: 21},
  {name: 'Lagos', lon: 3.38, lat: 6.52, continent: 'Africa', pop: 15},
  {name: 'New York', lon: -74.01, lat: 40.71, continent: 'Americas', pop: 18.8},
  {name: 'São Paulo', lon: -46.63, lat: -23.55, continent: 'Americas', pop: 22},
  {
    name: 'Mexico City',
    lon: -99.13,
    lat: 19.43,
    continent: 'Americas',
    pop: 21.8,
  },
  {name: 'Sydney', lon: 151.21, lat: -33.87, continent: 'Oceania', pop: 5.3},
];

const features = cities.map(
  (city) =>
    new Feature({
      geometry: new Point(fromLonLat([city.lon, city.lat])),
      name: city.name,
      continent: city.continent,
      pop: city.pop,
    }),
);

const source = new VectorSource({features: features});

// One color expression, reused for both the symbol fill and the label fill.
const colorByContinent = [
  'match',
  ['get', 'continent'],
  'Europe',
  '#1b5e20',
  'Asia',
  '#b71c1c',
  'Africa',
  '#e65100',
  'Americas',
  '#0d47a1',
  'Oceania',
  '#4a148c',
  '#000000',
];

// A single WebGLVectorLayer renders the point symbol AND its text label from
// one flat style and one source. The `text-*` properties are evaluated by the
// same pipeline as `circle-*`, so labels support data-driven expressions and
// style variables just like the rest of the style.
const layer = new WebGLVectorLayer({
  source: source,
  variables: {haloWidth: 3},
  style: {
    // point symbol, sized by population
    'circle-radius': ['interpolate', ['linear'], ['get', 'pop'], 1, 4, 40, 14],
    'circle-fill-color': colorByContinent,
    'circle-stroke-color': 'rgba(255, 255, 255, 0.9)',
    'circle-stroke-width': 1.5,
    // text label, integrated in the same layer
    'text-value': ['get', 'name'],
    'text-font': 'bold 13px sans-serif',
    'text-fill-color': colorByContinent,
    'text-stroke-color': 'rgba(255, 255, 255, 0.95)',
    // halo width is a style variable, updated live below with no buffer rebuild
    'text-stroke-width': ['var', 'haloWidth'],
  },
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      opacity: 0.6,
    }),
    layer,
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([10, 30]),
    zoom: 2,
  }),
});

// Live restyle of the label halo via a style variable. Because text color and
// outline are GPU expressions, this updates without regenerating the buffers.
const haloInput = document.getElementById('halo');
const haloValue = document.getElementById('haloValue');
haloInput.addEventListener('input', () => {
  const width = parseFloat(haloInput.value);
  haloValue.textContent = width;
  layer.updateStyleVariables({haloWidth: width});
});

// Hit detection works for labelled features: click a city to identify it.
const info = document.getElementById('info');
map.on('click', (event) => {
  let hit = null;
  map.forEachFeatureAtPixel(
    event.pixel,
    (feature) => {
      hit = feature;
      return true;
    },
    {hitTolerance: 5},
  );
  info.textContent = hit
    ? `${hit.get('name')} — ${hit.get('continent')} — ${hit.get('pop')}M`
    : 'Click a city to identify it';
});
