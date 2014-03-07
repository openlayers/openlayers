var view = new ol.View2D({
  center: [0, 0],
  zoom: 2
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: view
});

var geolocation = new ol.Geolocation();
geolocation.bindTo('projection', view);

var track = new ol.dom.Input(document.getElementById('track'));
track.bindTo('checked', geolocation, 'tracking');

geolocation.on('propertychange', function() {
  $('#accuracy').text(geolocation.getAccuracy() + ' [m]');
  $('#altitude').text(geolocation.getAltitude() + ' [m]');
  $('#altitudeAccuracy').text(geolocation.getAltitudeAccuracy() + ' [m]');
  $('#heading').text(geolocation.getHeading() + ' [rad]');
  $('#speed').text(geolocation.getSpeed() + ' [m/s]');
});

var marker = new ol.Overlay({
  element: /** @type {Element} */ ($('<i/>').addClass('icon-flag').get(0)),
  positioning: 'bottom-left',
  stopEvent: false
});
map.addOverlay(marker);
// bind the marker position to the device location.
marker.bindTo('position', geolocation);

geolocation.on('change:accuracy', function() {
  $(marker.getElement()).tooltip({
    title: this.getAccuracy() + 'm from this point'
  });
});
geolocation.on('error', function(error) {
  var info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});
