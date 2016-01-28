goog.require('ol.Geolocation');
goog.require('ol.Map');
goog.require('ol.Overlay');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');

// creating the view
var view = new ol.View({
  center: ol.proj.fromLonLat([5.8713, 45.6452]),
  zoom: 19
});

// creating the map
var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: view
});

// Geolocation marker
var markerEl = document.getElementById('geolocation_marker');
var marker = new ol.Overlay({
  positioning: 'center-center',
  element: markerEl,
  stopEvent: false
});
map.addOverlay(marker);

// LineString to store the different geolocation positions. This LineString
// is time aware.
// The Z dimension is actually used to store the rotation (heading).
var positions = new ol.geom.LineString([],
    /** @type {ol.geom.GeometryLayout} */ ('XYZM'));

// Geolocation Control
var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
  projection: view.getProjection(),
  trackingOptions: {
    maximumAge: 10000,
    enableHighAccuracy: true,
    timeout: 600000
  }
}));

var deltaMean = 500; // the geolocation sampling period mean in ms

// Listen to position changes
geolocation.on('change', function() {
  var position = geolocation.getPosition();
  var accuracy = geolocation.getAccuracy();
  var heading = geolocation.getHeading() || 0;
  var speed = geolocation.getSpeed() || 0;
  var m = Date.now();

  addPosition(position, heading, m, speed);

  var coords = positions.getCoordinates();
  var len = coords.length;
  if (len >= 2) {
    deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
  }

  var html = [
    'Position: ' + position[0].toFixed(2) + ', ' + position[1].toFixed(2),
    'Accuracy: ' + accuracy,
    'Heading: ' + Math.round(radToDeg(heading)) + '&deg;',
    'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
    'Delta: ' + Math.round(deltaMean) + 'ms'
  ].join('<br />');
  document.getElementById('info').innerHTML = html;
});

geolocation.on('error', function() {
  alert('geolocation error');
  // FIXME we should remove the coordinates in positions
});

// convert radians to degrees
function radToDeg(rad) {
  return rad * 360 / (Math.PI * 2);
}
// convert degrees to radians
function degToRad(deg) {
  return deg * Math.PI * 2 / 360;
}
// modulo for negative values
function mod(n) {
  return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

function addPosition(position, heading, m, speed) {
  var x = position[0];
  var y = position[1];
  var fCoords = positions.getCoordinates();
  var previous = fCoords[fCoords.length - 1];
  var prevHeading = previous && previous[2];
  if (prevHeading) {
    var headingDiff = heading - mod(prevHeading);

    // force the rotation change to be less than 180°
    if (Math.abs(headingDiff) > Math.PI) {
      var sign = (headingDiff >= 0) ? 1 : -1;
      headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
    }
    heading = prevHeading + headingDiff;
  }
  positions.appendCoordinate([x, y, heading, m]);

  // only keep the 20 last coordinates
  positions.setCoordinates(positions.getCoordinates().slice(-20));

  // FIXME use speed instead
  if (heading && speed) {
    markerEl.src = 'data/geolocation_marker_heading.png';
  } else {
    markerEl.src = 'data/geolocation_marker.png';
  }
}

var previousM = 0;
// change center and rotation before render
map.beforeRender(function(map, frameState) {
  if (frameState !== null) {
    // use sampling period to get a smooth transition
    var m = frameState.time - deltaMean * 1.5;
    m = Math.max(m, previousM);
    previousM = m;
    // interpolate position along positions LineString
    var c = positions.getCoordinateAtM(m, true);
    var view = frameState.viewState;
    if (c) {
      view.center = getCenterWithHeading(c, -c[2], view.resolution);
      view.rotation = -c[2];
      marker.setPosition(c);
    }
  }
  return true; // Force animation to continue
});

// recenters the view by putting the given coordinates at 3/4 from the top or
// the screen
function getCenterWithHeading(position, rotation, resolution) {
  var size = map.getSize();
  var height = size[1];

  return [
    position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
    position[1] + Math.cos(rotation) * height * resolution * 1 / 4
  ];
}

// postcompose callback
function render() {
  map.render();
}

// geolocate device
var geolocateBtn = document.getElementById('geolocate');
geolocateBtn.addEventListener('click', function() {
  geolocation.setTracking(true); // Start position tracking

  map.on('postcompose', render);
  map.render();

  disableButtons();
}, false);

// simulate device move
var simulationData;
var client = new XMLHttpRequest();
client.open('GET', 'data/geolocation-orientation.json');


/**
 * Handle data loading.
 */
client.onload = function() {
  simulationData = JSON.parse(client.responseText).data;
};
client.send();

var simulateBtn = document.getElementById('simulate');
simulateBtn.addEventListener('click', function() {
  var coordinates = simulationData;

  var first = coordinates.shift();
  simulatePositionChange(first);

  var prevDate = first.timestamp;
  function geolocate() {
    var position = coordinates.shift();
    if (!position) {
      return;
    }
    var newDate = position.timestamp;
    simulatePositionChange(position);
    window.setTimeout(function() {
      prevDate = newDate;
      geolocate();
    }, (newDate - prevDate) / 0.5);
  }
  geolocate();

  map.on('postcompose', render);
  map.render();

  disableButtons();
}, false);

function simulatePositionChange(position) {
  var coords = position.coords;
  geolocation.set('accuracy', coords.accuracy);
  geolocation.set('heading', degToRad(coords.heading));
  var position_ = [coords.longitude, coords.latitude];
  var projectedPosition = ol.proj.transform(position_, 'EPSG:4326',
      'EPSG:3857');
  geolocation.set('position', projectedPosition);
  geolocation.set('speed', coords.speed);
  geolocation.changed();
}

function disableButtons() {
  geolocateBtn.disabled = 'disabled';
  simulateBtn.disabled = 'disabled';
}
