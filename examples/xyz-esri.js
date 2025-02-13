import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import {useGeographic} from '../src/ol/proj.js';
import Source from '../src/ol/source/ImageTile.js';

useGeographic();

const map = new Map({
  target: 'map',
  layers: [
    new Layer({
      source: new Source({
        attributions:
          'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
          'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
        url:
          'https://server.arcgisonline.com/ArcGIS/rest/services/' +
          'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      }),
    }),
  ],
  view: new View({
    center: [-121.1, 47.5],
    zoom: 7,
  }),
});
