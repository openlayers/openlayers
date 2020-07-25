import Map from '../src/ol/Map.js';
import TopoJSON from '../src/ol/format/TopoJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const raster = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/maps/darkmatter/{z}/{x}/{y}.png?key=' + key,
    tileSize: 512,
  }),
});

const style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.6)',
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1,
  }),
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/topojson/world-110m.json',
    format: new TopoJSON({
      // don't want to render the full world polygon (stored as 'land' layer),
      // which repeats all countries
      layers: ['countries'],
    }),
    overlaps: false,
  }),
  style: style,
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
