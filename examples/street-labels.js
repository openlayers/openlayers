// NOCOMPILE
/* global labelgun, labelSegment, textPath */
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_extent_ from '../src/ol/extent';
import _ol_format_GeoJSON_ from '../src/ol/format/geojson';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_layer_Vector_ from '../src/ol/layer/vector';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_Vector_ from '../src/ol/source/vector';
import _ol_style_Style_ from '../src/ol/style/style';

var emptyFn = function() {};
var labelEngine = new labelgun['default'](emptyFn, emptyFn);

var context, pixelRatio; // Will be set in the map's postcompose listener
function measureText(text) {
  return context.measureText(text).width * pixelRatio;
}

var extent, letters; // Will be set in the style's renderer function
function collectDrawData(letter, x, y, angle) {
  _ol_extent_.extend(extent, [x, y, x, y]);
  letters.push([x, y, angle, letter]);
}

var style = new _ol_style_Style_({
  renderer: function(coords, state) {
    var feature = state.feature;
    var text = feature.get('name');
    // Only create label when geometry has a long and straight segment
    var path = labelSegment(coords, Math.PI / 8, measureText(text));
    if (path) {
      extent = _ol_extent_.createEmpty();
      letters = [];
      textPath(text, path, measureText, collectDrawData);
      _ol_extent_.buffer(extent, 5 * pixelRatio, extent);
      var bounds = {
        bottomLeft: _ol_extent_.getBottomLeft(extent),
        topRight: _ol_extent_.getTopRight(extent)
      };
      labelEngine.ingestLabel(bounds, feature.getId(), 1, letters, text, false);
    }
  }
});

var rasterLayer = new _ol_layer_Tile_({
  source: new _ol_source_BingMaps_({
    key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
    imagerySet: 'Aerial'
  })
});

var vectorLayer = new _ol_layer_Vector_({
  source: new _ol_source_Vector_({
    format: new _ol_format_GeoJSON_(),
    url: 'data/geojson/vienna-streets.geojson'
  }),
  style: function(feature) {
    if (feature.getGeometry().getType() == 'LineString' && feature.get('name')) {
      return style;
    }
  }
});

var viewExtent = [1817379, 6139595, 1827851, 6143616];
var map = new _ol_Map_({
  layers: [rasterLayer, vectorLayer],
  target: 'map',
  view: new _ol_View_({
    extent: viewExtent,
    center: _ol_extent_.getCenter(viewExtent),
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
