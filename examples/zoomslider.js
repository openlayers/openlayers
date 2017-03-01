goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.ZoomSlider');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');


/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {ol.Map} The ol.Map instance.
 */
var createMap = function(divId) {
  var source, layer, map, zoomslider;

  source = new ol.source.OSM();
  layer = new ol.layer.Tile({
    source: source
  });
  map = new ol.Map({
    layers: [layer],
    target: divId,
    view: new ol.View({
      center: [0, 0],
      zoom: 2
    })
  });
  zoomslider = new ol.control.ZoomSlider();
  map.addControl(zoomslider);
  return map;
};

var map1 = createMap('map1');
var map2 = createMap('map2');
var map3 = createMap('map3');
