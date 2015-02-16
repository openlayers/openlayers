goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var source = new ol.source.OSM();
source.on('tileloadstart', function(event) {
  console.log('start', event.tile.getImage().src);
});
source.on('tileloadend', function(event) {
  console.log('end', event.tile.getImage().src);
});
source.on('tileloaderror', function(event) {
  console.log('error', event.tile.getImage().src);
});


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({source: source})
  ],
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});
