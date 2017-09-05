// NOCOMPILE
/* global labelgun */
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Fill_ from '../src/ol/style/fill';
import _ol_style_Stroke_ from '../src/ol/style/stroke';
import _ol_style_Style_ from '../src/ol/style/style';

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

var map = new _ol_Map_({
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 1
  })
});

var emptyFn = function() {};
var labelEngine = new labelgun['default'](emptyFn, emptyFn);

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
  return _ol_extent_.getWidth(b.getExtent()) - _ol_extent_.getWidth(a.getExtent());
}

var labelStyle = new _ol_style_Style_({
  renderer: function(coords, state) {
    var text = state.feature.get('name');
    createLabel(textCache[text], text, coords);
  }
});
var countryStyle = new _ol_style_Style_({
  fill: new _ol_style_Fill_({
    color: 'rgba(255, 255, 255, 0.6)'
  }),
  stroke: new _ol_style_Stroke_({
    color: '#319FD3',
    width: 1
  })
});
var styleWithLabel = [countryStyle, labelStyle];
var styleWithoutLabel = [countryStyle];

var pixelRatio; // This is set by the map's precompose listener
var vectorLayer = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    url: 'data/geojson/countries.geojson',
    format: new _ol_format_GeoJSON_()
  }),
  style: function(feature, resolution) {
    var text = feature.get('name');
    var width = textMeasureContext.measureText(text).width;
    var geometry = feature.getGeometry();
    if (geometry.getType() == 'MultiPolygon') {
      geometry = geometry.getPolygons().sort(sortByWidth)[0];
    }
    var extentWidth = _ol_extent_.getWidth(geometry.getExtent());
    if (extentWidth / resolution > width) {
      // Only consider label when it fits its geometry's extent
      if (!(text in textCache)) {
        // Draw the label to its own canvas and cache it.
        var canvas = textCache[text] = document.createElement('CANVAS');
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        var context = canvas.getContext('2d');
        context.scale(pixelRatio, pixelRatio);
        setStyle(context);
        context.strokeText(text, 0, 0);
        context.fillText(text, 0, 0);
      }
      labelStyle.setGeometry(geometry.getInteriorPoint());
      return styleWithLabel;
    } else {
      return styleWithoutLabel;
    }
  }
});
vectorLayer.on('precompose', function(e) {
  pixelRatio = e.frameState.pixelRatio;
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
