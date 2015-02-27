goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var stepSize = 1000,
    stepDirection = 'N',
    stepCount = 0,
    head = [2952104.019976033, -3277504.823700756],
    numCoordinates = 1;

var takeStep = function(coordinate) {
  var x = coordinate[0],
      y = coordinate[1];
  switch (stepDirection) {
    case 'N': return [x, y + stepSize];
    case 'S': return [x, y - stepSize];
    case 'E': return [x + stepSize, y];
    case 'W': return [x - stepSize, y];
    default:
      throw new Error('invalid direction: ' + stepDirection);
  }
};

var nextDirection = function(direction) {
  switch (direction) {
    case 'N': return 'W';
    case 'W': return 'S';
    case 'S': return 'E';
    case 'E': return 'N';
  }
};

var nextStep = function(coordinate) {
  stepCount++;
  if (stepCount >= 20) {
    stepCount = 0;
    stepDirection = nextDirection(stepDirection);
  }
  return takeStep(coordinate);
};

var lineString = new ol.geom.LineString([head]);

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [
          new ol.Feature({ geometry: lineString })
        ]
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: head,
    zoom: 10
  })
});

var update = function() {
  numCoordinates++;
  head = nextStep(head);
  lineString.appendCoordinate(head);
  if (numCoordinates > 20) {
    numCoordinates--;
    lineString.spliceCoordinates(0, 1);
  }
};

map.on('postrender', update);
