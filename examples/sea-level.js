// NOCOMPILE
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import _ol_layer_Image_ from '../src/ol/layer/Image.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {fromLonLat} from '../src/ol/proj.js';
import RasterSource from '../src/ol/source/Raster.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';

function flood(pixels, data) {
  var pixel = pixels[0];
  if (pixel[3]) {
    var height = -10000 + ((pixel[0] * 256 * 256 + pixel[1] * 256 + pixel[2]) * 0.1);
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

var key = 'pk.eyJ1IjoidHNjaGF1YiIsImEiOiJjaW5zYW5lNHkxMTNmdWttM3JyOHZtMmNtIn0.CDIBD8H-G2Gf-cPkIuWtRg';
var elevation = new _ol_source_XYZ_({
  url: 'https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=' + key,
  crossOrigin: 'anonymous',
  transition: 0
});

var raster = new RasterSource({
  sources: [elevation],
  operation: flood
});

var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new _ol_source_XYZ_({
        url: 'https://api.mapbox.com/styles/v1/tschaub/ciutc102t00c62js5fqd47kqw/tiles/256/{z}/{x}/{y}?access_token=' + key
      })
    }),
    new _ol_layer_Image_({
      opacity: 0.6,
      source: raster
    })
  ],
  view: new View({
    center: fromLonLat([-122.3267, 37.8377]),
    zoom: 11
  })
});

var control = document.getElementById('level');
var output = document.getElementById('output');
control.addEventListener('input', function() {
  output.innerText = control.value;
  raster.changed();
});
output.innerText = control.value;

raster.on('beforeoperations', function(event) {
  event.data.level = control.value;
});

var locations = document.getElementsByClassName('location');
for (var i = 0, ii = locations.length; i < ii; ++i) {
  locations[i].addEventListener('click', relocate);
}

function relocate(event) {
  var data = event.target.dataset;
  var view = map.getView();
  view.setCenter(fromLonLat(data.center.split(',').map(Number)));
  view.setZoom(Number(data.zoom));
}
