import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoTIFF from '../src/ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
    },
  ],
});

const map = new Map({
  layers: [new TileLayer({source: source})],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [3.7e6, 1.9e6],
    zoom: 8,
  }),
});

const docs = document.getElementById('docs');

map.on('loadstart', function () {
  docs.textContent += ' loadstart';
  map.getTargetElement().classList.add('spinner');
});
map.on('loadend', function () {
  docs.textContent += ' loadend';
  map.getTargetElement().classList.remove('spinner');
});

source.getView().then(() => {
  docs.textContent += ' cogready';
});
