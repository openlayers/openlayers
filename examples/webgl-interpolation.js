import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {createXYZ} from '../src/ol/tilegrid.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const source = new XYZ({
  attributions: attributions,
  url: 'https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=' + key,
  tileSize: 512,
  maxZoom: 12,
  crossOrigin: '',
});

const view = new View({
  center: [6.893, 45.8295],
  zoom: 16,
  projection: 'EPSG:4326',
});

source.setTileGridForProjection(
  view.getProjection(),
  createXYZ({
    extent: view.getProjection().getExtent(),
    tileSize: 512,
    maxZoom: 12,
  }),
  true
);

// The elevation is (pixelValue * 0.1) - 10000
// but pixelValue is sufficient for interpolation
const pixelValue = [
  '*',
  255,
  [
    '+',
    ['*', 256 * 256, ['band', 1]],
    ['+', ['*', 256, ['band', 2]], ['band', 3]],
  ],
];

const style = {
  color: [
    'array',
    ['/', ['floor', ['/', pixelValue, 256 * 256]], 255],
    ['/', ['floor', ['/', ['%', pixelValue, 256 * 256], 256]], 255],
    ['/', ['%', pixelValue, 256], 255],
    1,
  ],
};

const interpolated = new TileLayer({
  style: style,
  source: source,
});

const map = new Map({
  target: 'map',
  layers: [interpolated],
  view: view,
});

const info = document.getElementById('info');

const showElevations = function (evt) {
  if (evt.dragging) {
    return;
  }
  map.forEachLayerAtPixel(
    evt.pixel,
    function (layer, pixel) {
      const height =
        -10000 + (pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1;
      info.innerText = height.toFixed(1);
    },
    {
      layerFilter: function (layer) {
        return layer === interpolated;
      },
    }
  );
};

map.on('pointermove', showElevations);
