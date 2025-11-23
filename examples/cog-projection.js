import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {fromProjectionCode, register} from '../src/ol/proj/proj4.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import XYZ from '../src/ol/source/XYZ.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

register(proj4);

const cogSource = new GeoTIFF({
  sources: [
    {
      url: 'https://mikenunn.net/data/MiniScale_(std_with_grid)_R23.tif',
      nodata: 0,
    },
  ],
});

cogSource.setAttributions(
  'Contains OS data © Crown Copyright and database right ' +
    new Date().getFullYear(),
);

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
        maxZoom: 20,
        crossOrigin: '',
      }),
      style: {exposure: 0.2},
    }),
    new TileLayer({
      source: cogSource,
      opacity: 0.7,
      style: {gamma: 0.7},
    }),
  ],
  view: cogSource
    .getView()
    .then((viewConfig) =>
      fromProjectionCode(viewConfig.projection.getCode()).then(
        () => viewConfig,
      ),
    ),
});
