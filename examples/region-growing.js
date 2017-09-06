// NOCOMPILE
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Image_ from '../src/ol/layer/image';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_proj_ from '../src/ol/proj';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';
import _ol_source_Raster_ from '../src/ol/source/raster';

function growRegion(inputs, data) {
  var image = inputs[0];
  var seed = data.pixel;
  var delta = parseInt(data.delta);
  if (!seed) {
    return image;
  }

  seed = seed.map(Math.round);
  var width = image.width;
  var height = image.height;
  var inputData = image.data;
  var outputData = new Uint8ClampedArray(inputData);
  var seedIdx = (seed[1] * width + seed[0]) * 4;
  var seedR = inputData[seedIdx];
  var seedG = inputData[seedIdx + 1];
  var seedB = inputData[seedIdx + 2];
  var edge = [seed];
  while (edge.length) {
    var newedge = [];
    for (var i = 0, ii = edge.length; i < ii; i++) {
      // As noted in the Raster source constructor, this function is provided
      // using the `lib` option. Other functions will NOT be visible unless
      // provided using the `lib` option.
      var next = next4Edges(edge[i]);
      for (var j = 0, jj = next.length; j < jj; j++) {
        var s = next[j][0], t = next[j][1];
        if (s >= 0 && s < width && t >= 0 && t < height) {
          var ci = (t * width + s) * 4;
          var cr = inputData[ci];
          var cg = inputData[ci + 1];
          var cb = inputData[ci + 2];
          var ca = inputData[ci + 3];
          // if alpha is zero, carry on
          if (ca === 0) {
            continue;
          }
          if (Math.abs(seedR - cr) < delta && Math.abs(seedG - cg) < delta &&
              Math.abs(seedB - cb) < delta) {
            outputData[ci] = 255;
            outputData[ci + 1] = 0;
            outputData[ci + 2] = 0;
            outputData[ci + 3] = 255;
            newedge.push([s, t]);
          }
          // mark as visited
          inputData[ci + 3] = 0;
        }
      }
    }
    edge = newedge;
  }
  return {data: outputData, width: width, height: height};
}

function next4Edges(edge) {
  var x = edge[0], y = edge[1];
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1]
  ];
}

var key = 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5';

var imagery = new _ol_layer_Tile_({
  source: new _ol_source_BingMaps_({key: key, imagerySet: 'Aerial'})
});

var raster = new _ol_source_Raster_({
  sources: [imagery.getSource()],
  operationType: 'image',
  operation: growRegion,
  // Functions in the `lib` object will be available to the operation run in
  // the web worker.
  lib: {
    next4Edges: next4Edges
  }
});

var rasterImage = new _ol_layer_Image_({
  opacity: 0.7,
  source: raster
});

var map = new _ol_Map_({
  layers: [imagery, rasterImage],
  target: 'map',
  view: new _ol_View_({
    center: _ol_proj_.fromLonLat([-119.07, 47.65]),
    zoom: 11
  })
});

var coordinate;

map.on('click', function(event) {
  coordinate = event.coordinate;
  raster.changed();
});

var thresholdControl = document.getElementById('threshold');

raster.on('beforeoperations', function(event) {
  // the event.data object will be passed to operations
  var data = event.data;
  data.delta = thresholdControl.value;
  if (coordinate) {
    data.pixel = map.getPixelFromCoordinate(coordinate);
  }
});

function updateControlValue() {
  document.getElementById('threshold-value').innerText = thresholdControl.value;
}
updateControlValue();

thresholdControl.addEventListener('input', function() {
  updateControlValue();
  raster.changed();
});
