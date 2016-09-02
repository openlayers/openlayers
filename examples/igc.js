goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.format.IGC');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


var colors = {
  'Clement Latour': 'rgba(0, 0, 255, 0.7)',
  'Damien de Baesnt': 'rgba(0, 215, 255, 0.7)',
  'Sylvain Dhonneur': 'rgba(0, 165, 255, 0.7)',
  'Tom Payne': 'rgba(0, 255, 255, 0.7)',
  'Ulrich Prinz': 'rgba(0, 215, 255, 0.7)'
};

var styleCache = {};
var styleFunction = function(feature) {
  var color = colors[feature.get('PLT')];
  var style = styleCache[color];
  if (!style) {
    style = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    });
    styleCache[color] = style;
  }
  return style;
};

var vectorSource = new ol.source.Vector();

var igcUrls = [
  'data/igc/Clement-Latour.igc',
  'data/igc/Damien-de-Baenst.igc',
  'data/igc/Sylvain-Dhonneur.igc',
  'data/igc/Tom-Payne.igc',
  'data/igc/Ulrich-Prinz.igc'
];

function get(url, callback) {
  var client = new XMLHttpRequest();
  client.open('GET', url);
  client.onload = function() {
    callback(client.responseText);
  };
  client.send();
}

var igcFormat = new ol.format.IGC();
for (var i = 0; i < igcUrls.length; ++i) {
  get(igcUrls[i], function(data) {
    var features = igcFormat.readFeatures(data,
        {featureProjection: 'EPSG:3857'});
    vectorSource.addFeatures(features);
  });
}

var time = {
  start: Infinity,
  stop: -Infinity,
  duration: 0
};
vectorSource.on('addfeature', function(event) {
  var geometry = event.feature.getGeometry();
  time.start = Math.min(time.start, geometry.getFirstCoordinate()[2]);
  time.stop = Math.max(time.stop, geometry.getLastCoordinate()[2]);
  time.duration = time.stop - time.start;
});


var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM({
        attributions: [
          'All maps © <a href="http://www.opencyclemap.org/">OpenCycleMap</a>',
          ol.source.OSM.ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    }),
    new ol.layer.Vector({
      source: vectorSource,
      style: styleFunction
    })
  ],
  target: 'map',
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false
    })
  }),
  view: new ol.View({
    center: [703365.7089403362, 5714629.865071137],
    zoom: 9
  })
});


var point = null;
var line = null;
var displaySnap = function(coordinate) {
  var closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  var info = document.getElementById('info');
  if (closestFeature === null) {
    point = null;
    line = null;
    info.innerHTML = '&nbsp;';
  } else {
    var geometry = closestFeature.getGeometry();
    var closestPoint = geometry.getClosestPoint(coordinate);
    if (point === null) {
      point = new ol.geom.Point(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    var date = new Date(closestPoint[2] * 1000);
    info.innerHTML =
        closestFeature.get('PLT') + ' (' + date.toUTCString() + ')';
    var coordinates = [coordinate, [closestPoint[0], closestPoint[1]]];
    if (line === null) {
      line = new ol.geom.LineString(coordinates);
    } else {
      line.setCoordinates(coordinates);
    }
  }
  map.render();
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displaySnap(coordinate);
});

map.on('click', function(evt) {
  displaySnap(evt.coordinate);
});

var stroke = new ol.style.Stroke({
  color: 'rgba(255,0,0,0.9)',
  width: 1
});
var style = new ol.style.Style({
  stroke: stroke,
  image: new ol.style.Circle({
    radius: 5,
    fill: null,
    stroke: stroke
  })
});
map.on('postcompose', function(evt) {
  var vectorContext = evt.vectorContext;
  vectorContext.setStyle(style);
  if (point !== null) {
    vectorContext.drawGeometry(point);
  }
  if (line !== null) {
    vectorContext.drawGeometry(line);
  }
});

var featureOverlay = new ol.layer.Vector({
  source: new ol.source.Vector(),
  map: map,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 5,
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.9)'
      })
    })
  })
});

document.getElementById('time').addEventListener('input', function() {
  var value = parseInt(this.value, 10) / 100;
  var m = time.start + (time.duration * value);
  vectorSource.forEachFeature(function(feature) {
    var geometry = /** @type {ol.geom.LineString} */ (feature.getGeometry());
    var coordinate = geometry.getCoordinateAtM(m, true);
    var highlight = feature.get('highlight');
    if (highlight === undefined) {
      highlight = new ol.Feature(new ol.geom.Point(coordinate));
      feature.set('highlight', highlight);
      featureOverlay.getSource().addFeature(highlight);
    } else {
      highlight.getGeometry().setCoordinates(coordinate);
    }
  });
  map.render();
});
