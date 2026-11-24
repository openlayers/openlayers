import {apply} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Link from '../src/ol/interaction/Link.js';
import {fromLonLat} from '../src/ol/proj.js';
import {setDefaultRenderer} from '../src/ol/renderer.js';

const styleUrl =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';

// Mapbox GL zoom levels are based on 512 pixel tiles. With the same resolution
// at zoom level 0, view zoom levels match the zoom levels of the style.
const view = new View({
  center: fromLonLat([13.388, 52.517]),
  zoom: 13,
  maxResolution: 78271.51696402048,
});

const canvasMap = new Map({
  target: 'canvas-map',
  view,
});
const webgpuMap = new Map({
  target: 'webgpu-map',
  view,
});
canvasMap.addInteraction(new Link());

// apply() creates the layers once the style is loaded, with the renderer that
// is the default at that time.
apply(canvasMap, styleUrl).then(() => {
  setDefaultRenderer('webgpu');
  apply(webgpuMap, styleUrl);
});
