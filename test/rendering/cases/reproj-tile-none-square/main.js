import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';
import {toLonLat} from '../../../../src/ol/proj.js';

const tileGrid = createXYZ({tileSize: [512, 256]});
const extent = tileGrid.getTileCoordExtent([5, 3, 12]);
const center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];

const source = new XYZ({
  projection: 'EPSG:3857',
  minZoom: 5,
  maxZoom: 5,
  url: '/data/tiles/512x256/{z}/{x}/{y}.png',
  tileSize: [512, 256],
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: new View({
    projection: 'EPSG:4326',
    center: toLonLat(center),
    zoom: 5,
  }),
});

render();
