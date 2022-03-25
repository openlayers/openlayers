import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

const tileGrid = createXYZ();
const extent = tileGrid.getTileCoordExtent([5, 5, 12]);
const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

const source = new XYZ({
  transition: 0,
  minZoom: 5,
  maxZoom: 5,
  interpolate: false,
  url: '/data/tiles/osm/{z}/{x}/{y}.png',
});

const layer = new TileLayer({
  source: source,
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [layer],
  view: new View({
    center: center,
    zoom: 10,
  }),
});

render();
