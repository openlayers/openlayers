import {applyBackground, applyStyle} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Link from '../src/ol/interaction/Link.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import WebGPUVectorTileLayer from '../src/ol/layer/WebGPUVectorTile.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const styleUrl =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';

// Mapbox GL zoom levels are based on 512 pixel tiles. With the same resolution
// at zoom level 0, view zoom levels match the zoom levels of the style.
const view = new View({
  center: fromLonLat([13.388, 52.517]),
  zoom: 13,
  maxResolution: 78271.51696402048,
});

const canvasLayer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({}),
});
const webgpuLayer = new WebGPUVectorTileLayer({
  declutter: true,
  source: new VectorTileSource({}),
});

applyStyle(canvasLayer, styleUrl);
applyBackground(canvasLayer, styleUrl);
applyStyle(webgpuLayer, styleUrl);
applyBackground(webgpuLayer, styleUrl);

const map = new Map({
  target: 'canvas-map',
  layers: [canvasLayer],
  view,
});
new Map({
  target: 'webgpu-map',
  layers: [webgpuLayer],
  view,
});
map.addInteraction(new Link());
