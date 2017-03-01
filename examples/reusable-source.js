goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');

var urls = [
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-jan/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-bathy-jan/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-jul/{z}/{x}/{y}.png',
  'https://{a-c}.tiles.mapbox.com/v3/mapbox.blue-marble-topo-bathy-jul/{z}/{x}/{y}.png'
];

var source = new ol.source.XYZ();

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: source
    })
  ],
  view: new ol.View({
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
