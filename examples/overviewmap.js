goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.control.OverviewMap');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.OSM');


/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {ol.Map} The ol.Map instance.
 */
var createMap = function(divId) {
  return new ol.Map({
    layers: [
      new ol.layer.TileLayer({
        source: new ol.source.OSM()
      })
    ],
    renderers: ol.RendererHints.createFromQueryData(),
    target: divId,
    view: new ol.View2D({
      center: [0, 0],
      zoom: 2
    })
  });
};

var map1 = createMap('map1');
var overview1 = new ol.control.OverviewMap({
  map: map1
});

var map2 = createMap('map2');
var overview2 = new ol.control.OverviewMap({
  map: map2
});

var map3 = createMap('map3');
var overview3 = new ol.control.OverviewMap({
  map: map3,
  maxRatio: 0.5,
  minRatio: 0.025
});
