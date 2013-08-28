goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View2D');
goog.require('ol.coordinate');
goog.require('ol.layer.TileLayer');
goog.require('ol.proj');
goog.require('ol.source.TileJSON');


var layer = new ol.layer.TileLayer({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/' +
        'mapbox.natural-earth-hypso-bathy.jsonp',
    crossOrigin: 'anonymous'
  })
});

var map = new ol.Map({
  layers: [layer],
  target: 'map',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 2
  })
});


/**
 * Elements that make up the popup.
 */
var container = document.getElementById('popup-container');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');


/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
closer.onclick = function() {
  container.style.display = 'none';
  return false;
};


/**
 * Create an overlay to anchor the popup to the map.
 */
var overlay = new ol.Overlay({
  map: map,
  element: container
});


/**
 * Add a click handler to the map to render the popup.
 */
map.on('click', function(evt) {
  var coordinate = evt.getCoordinate();
  var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(
      coordinate, 'EPSG:3857', 'EPSG:4326'));

  overlay.setPosition(coordinate);
  content.innerHTML = '<p>The location you clicked was:</p><code>' + hdms +
      '</code>';
  container.style.display = 'block';

});
