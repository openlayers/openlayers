// NOCOMPILE
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.format.OSMXML');
goog.require('ol.geom.LineString');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.BingMaps');
goog.require('ol.source.Vector');
goog.require('ol.style.Style');

/* global labelgun */
var labelEngine = new labelgun['default'](function() {}, function() {});

function segmentSort(a, b) {
  return a.length - b.length;
}

function dist2D(p1, p2) {
  var dx = p2[0] - p1[0];
  var dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Modified from https://github.com/Viglino/ol3-ext/blob/7d17eef5720970fd36798ebc889ea44d9f04b059/style/settextpathstyle.js
function textPath(ctx, text, path, fid, pixelRatio) {
  var di, dpos = 0;
  var pos = 1;
  var letterPadding = ctx.measureText(' ').width * pixelRatio * 0.25;
  var d = 0;
  for (var i = 1; i < path.length; ++i) {
    d += dist2D(path[i - 1], path[i]);
  }
  var nbspace = text.split(' ').length - 1;
  var start = (d - ctx.measureText(text).width * pixelRatio - (text.length + nbspace) * letterPadding) / 2;
  var extent = ol.extent.createEmpty();
  var letters = [];
  for (var t = 0; t < text.length; t++) {
    var letter = text[t];
    var wl = ctx.measureText(letter).width * pixelRatio;
    var dl = start + wl / 2;
    if (!di || dpos + di < dl) {
      for (; pos < path.length;) {
        di = dist2D(path[pos - 1], path[pos]);
        if (dpos + di > dl) {
          break;
        }
        pos += 1;
        if (pos >= path.length) {
          break;
        }
        dpos += di;
      }
    }
    var x, y, a, dt = dl - dpos;
    if (pos >= path.length) {
      pos = path.length - 1;
    }
    a = Math.atan2(path[pos][1] - path[pos - 1][1], path[pos][0] - path[pos - 1][0]);
    if (!dt) {
      x = path[pos - 1][0];
      y = path[pos - 1][1];
    } else {
      x = path[pos - 1][0] + (path[pos][0] - path[pos - 1][0]) * dt / di;
      y = path[pos - 1][1] + (path[pos][1] - path[pos - 1][1]) * dt / di;
    }
    ol.extent.extendCoordinate(extent, [x, y]);
    letters.push([x, y, a, letter]);
    start += wl + letterPadding * (letter == ' ' ? 2 : 1);
  }
  ol.extent.buffer(extent, 5 * pixelRatio, extent);
  var bounds = {
    bottomLeft: ol.extent.getBottomLeft(extent),
    topRight: ol.extent.getTopRight(extent)
  };
  labelEngine.ingestLabel(bounds, fid, 1, letters, text, false);
}

var style = new ol.style.Style({
  geometry: function(feature) {
    // Use the longest, straight enough segment of the geometry
    var coords = feature.getGeometry().getCoordinates();
    /* global linelabel */
    var segment = linelabel(coords, Math.PI / 8).sort(segmentSort)[0];
    return new ol.geom.LineString(coords.slice(segment.beginIndex, segment.endIndex));
  },
  renderer: function(coords, geometry, feature, state) {
    var context = state.context;
    var pixelRatio = state.pixelRatio;
    var text = feature.get('name');
    if (text) {
      // Only consider label when the segment is long enough
      var labelLength = context.measureText(text).width * pixelRatio;
      var pathLength = 0;
      for (var i = 1, ii = coords.length; i < ii; ++i) {
        pathLength += dist2D(coords[i - 1], coords[i]);
        if (pathLength >= labelLength) {
          if (coords[0][0] > coords[coords.length - 1][0]) {
            // Attempt to make text upright
            coords.reverse();
          }
          textPath(context, text, coords, feature.getId(), pixelRatio);
          break;
        }
      }
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
var client = new XMLHttpRequest();
client.open('POST', 'https://overpass-api.de/api/interpreter');
client.addEventListener('load', function() {
  var features = new ol.format.OSMXML().readFeatures(client.responseText, {
    featureProjection: 'EPSG:3857'
  });
  source.addFeatures(features);
});
client.send('(way["highway"](48.19642,16.32580,48.22050,16.41986));(._;>;);out meta;');

var vectorLayer = new ol.layer.Vector({
  source: source,
  style: function(feature) {
    if (feature.getGeometry().getType() == 'LineString') {
      return style;
    }
  }
});

var extent = [1817379, 6139595, 1827851, 6143616];
var map = new ol.Map({
  layers: [rasterLayer, vectorLayer],
  target: 'map',
  view: new ol.View({
    extent: extent,
    center: ol.extent.getCenter(extent),
    zoom: 17,
    minZoom: 14
  })
});

vectorLayer.on('precompose', function() {
  labelEngine.destroy();
});
vectorLayer.on('postcompose', function(e) {
  var context = e.context;
  var pixelRatio = e.frameState.pixelRatio;
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
