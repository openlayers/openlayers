goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control.ZoomSlider');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


/**
 * Helper method for map-creation.
 *
 * @param {string} divId The id of the div for the map.
 * @return {ol.Map} The ol.Map instance.
 */
var createMap = function(divId) {
  var source, layer, map, zoomslider, resolutions, minRes, maxRes;

  source = new ol.source.MapQuestOpenAerial();
  resolutions = source.getResolutions();
  minRes = resolutions[resolutions.length - 1];
  maxRes = resolutions[0];

  layer = new ol.layer.TileLayer({
    source: source
  });
  map = new ol.Map({
    layers: [layer],
    target: divId,
    view: new ol.View2D({
      center: new ol.Coordinate(0, 0),
      zoom: 2
    })
  });
  zoomslider = new ol.control.ZoomSlider({
    minResolution: minRes,
    maxResolution: maxRes,
    map: map
  });
  return map;
};

var map1 = createMap('map1');
var map2 = createMap('map2');
var map3 = createMap('map3');
