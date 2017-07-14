// NOCOMPILE
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.GeoJSON');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');

// Style for labels
function setStyle(context) {
  context.font = '12px Calibri,sans-serif';
  context.fillStyle = '#000';
  context.strokeStyle = '#fff';
  context.lineWidth = 3;
  context.textBaseline = 'hanging';
  context.textAlign = 'start';
}

// A separate canvas context for measuring label width and height.
var textMeasureContext = document.createElement('CANVAS').getContext('2d');
setStyle(textMeasureContext);

// The label height is approximated by the width of the text 'WI'.
var height = textMeasureContext.measureText('WI').width;

// A cache for reusing label images once they have been created.
var textCache = {};

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 1
  })
});

/*global labelgun*/
var labelEngine = new labelgun['default'](function() {}, function() {});

function createLabel(canvas, text, coord) {
  var halfWidth = canvas.width / 2;
  var halfHeight = canvas.height / 2;
  var bounds = {
    bottomLeft: [Math.round(coord[0] - halfWidth), Math.round(coord[1] - halfHeight)],
    topRight: [Math.round(coord[0] + halfWidth), Math.round(coord[1] + halfHeight)]
  };
  labelEngine.ingestLabel(bounds, coord.toString(), 1, canvas, text, false);
}

// For multi-polygons, we only label the widest polygon. This is done by sorting
// by extent width in descending order, and take the first from the array.
function sortByWidth(a, b) {
  return ol.extent.getWidth(b.getExtent()) - ol.extent.getWidth(a.getExtent());
}

var resolution;
var styles = [
  new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new ol.style.Stroke({
      color: '#319FD3',
      width: 1
    })
  }),
  new ol.style.Style({
    renderer: function(coord, geometry, feature, state) {
      var pixelRatio = state.pixelRatio;
      var text = feature.get('name');
      var canvas = textCache[text];
      if (!canvas) {
        // Draw the label to its own canvas and cache it.
        var width = textMeasureContext.measureText(text).width;
        canvas = textCache[text] = document.createElement('CANVAS');
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        var context = canvas.getContext('2d');
        context.scale(pixelRatio, pixelRatio);
        setStyle(context);
        context.strokeText(text, 0, 0);
        context.fillText(text, 0, 0);
      }
      var extentWidth = geometry.getCoordinates()[2] / resolution * pixelRatio;
      if (extentWidth > canvas.width) {
        // Only consider labels not wider than their country's bounding box
        createLabel(canvas, text, coord);
      }
    },
    // Geometry function to determine label positions
    geometry: function(feature) {
      var geometry = feature.getGeometry();
      if (geometry.getType() == 'MultiPolygon') {
        var geometries = geometry.getPolygons();
        geometry = geometries.sort(sortByWidth)[0];
      }
      var coordinates = geometry.getInteriorPoint().getCoordinates();
      var extentWidth = ol.extent.getWidth(geometry.getExtent());
      coordinates.push(extentWidth);
      return new ol.geom.Point(coordinates, 'XYM');
    }
  })
];

var vectorLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/geojson/countries.geojson',
    format: new ol.format.GeoJSON()
  }),
  style: styles
});
vectorLayer.on('precompose', function(e) {
  resolution = e.frameState.viewState.resolution;
  labelEngine.destroy();
});
vectorLayer.on('postcompose', function(e) {
  var labels = labelEngine.getShown();
  for (var i = 0, ii = labels.length; i < ii; ++i) {
    var label = labels[i];
    // Draw label to the map canvas
    e.context.drawImage(label.labelObject, label.minX, label.minY);
  }
});


map.addLayer(vectorLayer);
