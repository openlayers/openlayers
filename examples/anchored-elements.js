goog.require('ol.AnchoredElement');
goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.MapQuestOpenAerial');


var layer = new ol.layer.TileLayer({
  source: new ol.source.MapQuestOpenAerial()
});

var map = new ol.Map({
  layers: new ol.Collection([layer]),
  renderers: ol.RendererHints.createFromQueryData(),
  target: 'map',
  view: new ol.View2D({
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});

// Vienna label
var vienna = new ol.AnchoredElement({
  map: map,
  position: ol.projection.transformWithCodes(
      new ol.Coordinate(16.3725, 48.208889), 'EPSG:4326', 'EPSG:3857'),
  element: document.getElementById('vienna')
});

// Popup showing the position the user clicked
var popup = new ol.AnchoredElement({
  map: map,
  element: document.getElementById('popup')
});
map.addEventListener('click', function(evt) {
  var coordinate = evt.getCoordinate();
  popup.getElement().innerHTML =
      'Welcome to ol3. The location you clicked was<br>' +
      ol.Coordinate.toStringHDMS(ol.projection.transformWithCodes(
          coordinate, 'EPSG:3857', 'EPSG:4326'));
  popup.setPosition(coordinate);
});


var transformCoords = ol.projection.getTransform(
  ol.projection.getFromCode('EPSG:4326'), map.getView().getProjection());

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://api.tiles.mapbox.com/v3/examples.map-zr0njcqy/markers.geojson', true);
xhr.onload = function(e) {
  if (this.status === 200) {
    var collection = JSON.parse(this.response);
    for (var i = 0; i < collection.features.length; i++) {
      var feature = collection.features[i];
      var props = feature.properties;

      var size = props['marker-size'].charAt(0) || 'm';
      var symbol = props['marker-symbol'];
      var color = (props['marker-color'] || '#7e7e7e').slice(1);

      var filename = 'pin-' + size + '-' + symbol + '+' + color + '.png';
      var img = document.createElement('img');
      img.src = 'http://api.tiles.mapbox.com/v3/marker/' + filename;
      img.className = 'marker ' + size;
      img.title = props.title;

      var coords = feature.geometry.coordinates;
      var vertex = [coords[0], coords[1]];
      vertex = transformCoords(vertex, vertex, 2);
      var marker = new ol.AnchoredElement({
        map: map,
        element: img,
        position: new ol.Coordinate(vertex[0], vertex[1])
      });
    }
  }
};
xhr.send();
