import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';


var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new _ol_source_XYZ_({
        attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
            'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      })
    })
  ],
  view: new View({
    center: fromLonLat([-121.1, 47.5]),
    zoom: 7
  })
});
