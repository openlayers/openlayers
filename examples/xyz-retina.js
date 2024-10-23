import Layer from '../src/ol/layer/WebGLTile.js';
import Map from '../src/ol/Map.js';
import Source from '../src/ol/source/ImageTile.js';
import View from '../src/ol/View.js';
import {createXYZ} from '../src/ol/tilegrid.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const map = new Map({
  target: 'map',
  layers: [
    new Layer({
      source: new Source({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}@2x.png?key=' +
          key,
        tileSize: 512,
        tileGrid: createXYZ({tileSize: 256}),
      }),
    }),
  ],
  view: new View({
    center: [-112.21324137318899, 36.105337765976756],
    zoom: 13,
  }),
});
