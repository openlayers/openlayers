import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {Raster as RasterSource, TileJSON} from '../src/ol/source.js';
import XYZ from '../src/ol/source/XYZ.js';

function flood(pixels, data) {
  const pixel = pixels[0];
  if (pixel[3]) {
    const height = -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1);
    if (height <= data.level) {
      pixel[0] = 145;
      pixel[1] = 175;
      pixel[2] = 186;
      pixel[3] = 255;
    } else {
      pixel[3] = 0;
    }
  }
  return pixel;
}

const key = 'pk.eyJ1IjoidHNjaGF1YiIsImEiOiJjaW5zYW5lNHkxMTNmdWttM3JyOHZtMmNtIn0.CDIBD8H-G2Gf-cPkIuWtRg';
const elevation = new XYZ({
  url: 'https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=' + key,
  crossOrigin: 'anonymous'
});

const raster = new RasterSource({
  sources: [elevation],
  operation: flood
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new TileJSON({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
        crossOrigin: 'anonymous'
      })
    }),
    new ImageLayer({
      opacity: 0.6,
      source: raster
    })
  ],
  view: new View({
    center: fromLonLat([-122.3267, 37.8377]),
    zoom: 11
  })
});

const control = document.getElementById('level');
const output = document.getElementById('output');
control.addEventListener('input', function() {
  output.innerText = control.value;
  raster.changed();
});
output.innerText = control.value;

raster.on('beforeoperations', function(event) {
  event.data.level = control.value;
});

const locations = document.getElementsByClassName('location');
for (let i = 0, ii = locations.length; i < ii; ++i) {
  locations[i].addEventListener('click', relocate);
}

function relocate(event) {
  const data = event.target.dataset;
  const view = map.getView();
  view.setCenter(fromLonLat(data.center.split(',').map(Number)));
  view.setZoom(Number(data.zoom));
}
