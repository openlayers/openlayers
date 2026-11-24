import {apply} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import FullScreen from '../src/ol/control/FullScreen.js';
import Link from '../src/ol/interaction/Link.js';
import {fromLonLat} from '../src/ol/proj.js';
import {setDefaultRenderer} from '../src/ol/renderer.js';

setDefaultRenderer('webgpu');

const styleUrl =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';

// Mapbox GL zoom levels are based on 512 pixel tiles. With the same resolution
// at zoom level 0, view zoom levels match the zoom levels of the style.
const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat([13.388, 52.517]),
    zoom: 13,
    maxResolution: 78271.51696402048,
  }),
});
map.addControl(new FullScreen());
map.addInteraction(new Link());
apply(map, styleUrl);
