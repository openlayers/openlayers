import Map from '../src/ol/Map.js';
import RasterSource from '../src/ol/source/Raster.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {Image as ImageLayer, Tile as TileLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

function growRegion(inputs, data) {
  const image = inputs[0];
  let seed = data.pixel;
  const delta = parseInt(data.delta);
  if (!seed) {
    return image;
  }

  seed = seed.map(Math.round);
  const width = image.width;
  const height = image.height;
  const inputData = image.data;
  const outputData = new Uint8ClampedArray(inputData);
  const seedIdx = (seed[1] * width + seed[0]) * 4;
  const seedR = inputData[seedIdx];
  const seedG = inputData[seedIdx + 1];
  const seedB = inputData[seedIdx + 2];
  let edge = [seed];
  while (edge.length) {
    const newedge = [];
    for (let i = 0, ii = edge.length; i < ii; i++) {
      // As noted in the Raster source constructor, this function is provided
      // using the `lib` option. Other functions will NOT be visible unless
      // provided using the `lib` option.
      const next = next4Edges(edge[i]);
      for (let j = 0, jj = next.length; j < jj; j++) {
        const s = next[j][0];
        const t = next[j][1];
        if (s >= 0 && s < width && t >= 0 && t < height) {
          const ci = (t * width + s) * 4;
          const cr = inputData[ci];
          const cg = inputData[ci + 1];
          const cb = inputData[ci + 2];
          const ca = inputData[ci + 3];
          // if alpha is zero, carry on
          if (ca === 0) {
            continue;
          }
          if (
            Math.abs(seedR - cr) < delta &&
            Math.abs(seedG - cg) < delta &&
            Math.abs(seedB - cb) < delta
          ) {
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
  const x = edge[0];
  const y = edge[1];
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
}

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const imagery = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
    maxZoom: 20,
    crossOrigin: '',
  }),
});

const raster = new RasterSource({
  sources: [imagery.getSource()],
  operationType: 'image',
  operation: growRegion,
  // Functions in the `lib` object will be available to the operation run in
  // the web worker.
  lib: {
    next4Edges: next4Edges,
  },
});

const rasterImage = new ImageLayer({
  opacity: 0.7,
  source: raster,
});

const map = new Map({
  layers: [imagery, rasterImage],
  target: 'map',
  view: new View({
    center: fromLonLat([-119.07, 47.65]),
    zoom: 11,
  }),
});

let coordinate;

map.on('click', function (event) {
  coordinate = event.coordinate;
  raster.changed();
});

const thresholdControl = document.getElementById('threshold');

raster.on('beforeoperations', function (event) {
  // the event.data object will be passed to operations
  const data = event.data;
  data.delta = thresholdControl.value;
  if (coordinate) {
    data.pixel = map.getPixelFromCoordinate(coordinate);
  }
});

function updateControlValue() {
  document.getElementById('threshold-value').innerText = thresholdControl.value;
}
updateControlValue();

thresholdControl.addEventListener('input', function () {
  updateControlValue();
  raster.changed();
});
