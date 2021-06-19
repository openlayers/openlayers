import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import {TileDebug, XYZ} from '../../../../src/ol/source.js';
import {createForProjection, createXYZ} from '../../../../src/ol/tilegrid.js';
import {get, toLonLat} from '../../../../src/ol/proj.js';

const tileGrid = createXYZ();
const extent = tileGrid.getTileCoordExtent([5, 5, 12]);
const center = [(extent[0] + extent[2]) / 2, extent[1]];

const source = new XYZ({
  transition: 0,
  minZoom: 5,
  maxZoom: 5,
  url: '/data/tiles/osm/{z}/{x}/{y}.png',
});

const sourceDebug = new TileDebug({tileGrid: source.getTileGrid()});

source.setTileGridForProjection(
  get('EPSG:4326'),
  createForProjection(get('EPSG:4326'), 7, [64, 64])
);

sourceDebug.setTileGridForProjection(
  get('EPSG:4326'),
  createForProjection(get('EPSG:4326'), 7, [64, 64])
);

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
    new TileLayer({
      source: sourceDebug,
    }),
  ],
  view: new View({
    projection: 'EPSG:4326',
    center: toLonLat(center),
    zoom: 5,
  }),
});

render();
