import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import {OSM, TileDebug} from '../src/ol/source.js';


const osmSource = new OSM();
const map = new Map({
  layers: [
    new TileLayer({
      source: osmSource
    }),
    new TileLayer({
      source: new TileDebug({
        projection: 'EPSG:3857',
        tileGrid: osmSource.getTileGrid()
      })
    })
  ],
  target: 'map',
  controls: defaultControls({
    attributionOptions: {
      collapsible: false
    }
  }),
  view: new View({
    center: fromLonLat([-0.1275, 51.507222]),
    zoom: 10
  })
});
