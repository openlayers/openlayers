goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.IGC');
goog.require('ol.source.OSM');
goog.require('ol.style.Circle');
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
var styleFunction = function(feature, resolution) {
  var color = colors[feature.get('PLT')];
  var styleArray = styleCache[color];
  if (!styleArray) {
    styleArray = [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    })];
    styleCache[color] = styleArray;
  }
  return styleArray;
};

var vectorSource = new ol.source.IGC({
  urls: [
    'data/igc/Clement-Latour.igc',
    'data/igc/Damien-de-Baenst.igc',
    'data/igc/Sylvain-Dhonneur.igc',
    'data/igc/Tom-Payne.igc',
    'data/igc/Ulrich-Prinz.igc'
  ]
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM({
        attributions: [
          new ol.Attribution({
            html: 'All maps &copy; ' +
                '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>'
          }),
          ol.source.OSM.DATA_ATTRIBUTION
        ],
        url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
      })
    }),
    new ol.layer.Vector({
      source: vectorSource,
      styleFunction: styleFunction
    })
  ],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
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
  map.requestRenderFrame();
};

$(map.getViewport()).on('mousemove', function(evt) {
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displaySnap(coordinate);
});

map.on('singleclick', function(evt) {
  displaySnap(evt.coordinate);
});

var imageStyle = new ol.style.Circle({
  radius: 5,
  fill: null,
  stroke: new ol.style.Stroke({
    color: 'rgba(255,0,0,0.9)',
    width: 1
  })
});
var strokeStyle = new ol.style.Stroke({
  color: 'rgba(255,0,0,0.9)',
  width: 1
});
map.on('postcompose', function(evt) {
  var render = evt.render;
  if (point !== null) {
    render.setImageStyle(imageStyle);
    render.drawPointGeometry(point);
  }
  if (line !== null) {
    render.setFillStrokeStyle(null, strokeStyle);
    render.drawLineStringGeometry(line);
  }
});
