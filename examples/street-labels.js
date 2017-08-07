// NOCOMPILE
/* global labelgun, labelSegment, textPath */
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.OSMXML');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');

var emptyFn = function() {};
var labelEngine = new labelgun['default'](emptyFn, emptyFn);

var context, pixelRatio; // Will be set in the map's postcompose listener
function measureText(text) {
  return context.measureText(text).width * pixelRatio;
}

var extent, letters; // Will be set in the style's renderer function
function collectDrawData(letter, x, y, angle) {
  ol.extent.extend(extent, [x, y, x, y]);
  letters.push([x, y, angle, letter]);
}

var style = new ol.style.Style({
  renderer: function(coords, context) {
    var feature = context.feature;
    var text = feature.get('name');
    // Only create label when geometry has a long and straight segment
    var path = labelSegment(coords, Math.PI / 8, measureText(text));
    if (path) {
      extent = ol.extent.createEmpty();
      letters = [];
      textPath(text, path, measureText, collectDrawData);
      ol.extent.buffer(extent, 5 * pixelRatio, extent);
      var bounds = {
        bottomLeft: ol.extent.getBottomLeft(extent),
        topRight: ol.extent.getTopRight(extent)
      };
      labelEngine.ingestLabel(bounds, feature.getId(), 1, letters, text, false);
    }
  }
});

var rasterLayer = new ol.layer.Tile({
  source: new ol.source.BingMaps({
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
    imagerySet: 'Aerial'
  })
});

var source = new ol.source.Vector();
// Request streets from OSM, using the Overpass API
fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  body: '(way["highway"](48.19642,16.32580,48.22050,16.41986));(._;>;);out meta;'
}).then(function(response) {
  return response.text();
}).then(function(responseText) {
  var features = new ol.format.OSMXML().readFeatures(responseText, {
    featureProjection: 'EPSG:3857'
  });
  source.addFeatures(features);
});

var vectorLayer = new ol.layer.Vector({
  source: source,
  style: function(feature) {
    if (feature.getGeometry().getType() == 'LineString' && feature.get('name')) {
      return style;
    }
  }
});

var viewExtent = [1817379, 6139595, 1827851, 6143616];
var map = new ol.Map({
  layers: [rasterLayer, vectorLayer],
  target: 'map',
  view: new ol.View({
    extent: viewExtent,
    center: ol.extent.getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});

vectorLayer.on('precompose', function() {
  labelEngine.destroy();
});
vectorLayer.on('postcompose', function(e) {
  context = e.context;
  pixelRatio = e.frameState.pixelRatio;
  context.save();
  context.font = 'normal 11px "Open Sans", "Arial Unicode MS"';
  context.fillStyle = 'white';
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  var labels = labelEngine.getShown();
  for (var i = 0, ii = labels.length; i < ii; ++i) {
    // Render label letter by letter
    var letters = labels[i].labelObject;
    for (var j = 0, jj = letters.length; j < jj; ++j) {
      var labelData = letters[j];
      context.save();
      context.translate(labelData[0], labelData[1]);
      context.rotate(labelData[2]);
      context.scale(pixelRatio, pixelRatio);
      context.fillText(labelData[3], 0, 0);
      context.restore();
    }
  }
  context.restore();
});
