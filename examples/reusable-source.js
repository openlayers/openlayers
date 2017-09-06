import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_XYZ_ from '../src/ol/source/xyz';

var urls = [
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-jan/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-bathy-jan/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-jul/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-bathy-jul/{z}/{x}/{y}.png'
];

var source = new _ol_source_XYZ_();

var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: source
    })
  ],
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  })
});


function updateUrl(index) {
  source.setUrl(urls[index]);
}

var buttons = document.getElementsByClassName('switcher');
for (var i = 0, ii = buttons.length; i < ii; ++i) {
  var button = buttons[i];
  button.addEventListener('click', updateUrl.bind(null, Number(button.value)));
}

updateUrl(0);
