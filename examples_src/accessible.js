goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

jQuery('#map').after('<button type="button" ' +
    'onclick="map.getView().setZoom(map.getView().getZoom() - 1);">' +
    'Zoom out</button>');
jQuery('#map').after('<button type="button" ' +
    'onclick="map.getView().setZoom(map.getView().getZoom() + 1);">' +
    'Zoom in</button>');
