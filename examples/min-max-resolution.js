goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.TileJSON');


/**
 * Create the map.
 */
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      minResolution: 200,
      maxResolution: 2000
    }),
    new ol.layer.Tile({
      source: new ol.source.TileJSON({
        url: 'http://api.tiles.mapbox.com/v3/' +
            'mapbox.natural-earth-hypso-bathy.jsonp',
        crossOrigin: 'anonymous'
      }),
      minResolution: 2000,
      maxResolution: 20000
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
    center: [653600, 5723680],
    zoom: 5
  })
});
