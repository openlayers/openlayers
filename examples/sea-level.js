// NOCOMPILE
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_Raster_ from '../src/ol/source/raster';
import _ol_source_XYZ_ from '../src/ol/source/xyz';

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
  crossOrigin: 'anonymous'
});

var raster = new _ol_source_Raster_({
  sources: [elevation],
  operation: flood
});

var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_XYZ_({
        url: 'https://api.mapbox.com/styles/v1/tschaub/ciutc102t00c62js5fqd47kqw/tiles/256/{z}/{x}/{y}?access_token=' + key
      })
    }),
    new _ol_layer_Image_({
      opacity: 0.6,
      source: raster
    })
  ],
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([-122.3267, 37.8377]),
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
  view.setCenter(_ol_proj_.fromLonLat(data.center.split(',').map(Number)));
  view.setZoom(Number(data.zoom));
}
