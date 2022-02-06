import GeoTIFF from '../src/ol/source/GeoTIFF.js';
import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';

const source = new GeoTIFF({
  sources: [
    {
      // visible red, band 1 in the style expression above
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/B04.tif',
      max: 10000,
    },
    {
      // near infrared, band 2 in the style expression above
      url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/2020/S2A_36QWD_20200701_0_L2A/B08.tif',
      max: 10000,
    },
  ],
});

const layer = new TileLayer({
  style: {
    color: [
      'interpolate',
      ['linear'],
      // calculate NDVI, bands come from the sources below
      ['/', ['-', ['band', 2], ['band', 1]], ['+', ['band', 2], ['band', 1]]],
      // color ramp for NDVI values, ranging from -1 to 1
      -0.2,
      [191, 191, 191],
      -0.1,
      [219, 219, 219],
      0,
      [255, 255, 224],
      0.025,
      [255, 250, 204],
      0.05,
      [237, 232, 181],
      0.075,
      [222, 217, 156],
      0.1,
      [204, 199, 130],
      0.125,
      [189, 184, 107],
      0.15,
      [176, 194, 97],
      0.175,
      [163, 204, 89],
      0.2,
      [145, 191, 82],
      0.25,
      [128, 179, 71],
      0.3,
      [112, 163, 64],
      0.35,
      [97, 150, 54],
      0.4,
      [79, 138, 46],
      0.45,
      [64, 125, 36],
      0.5,
      [48, 110, 28],
      0.55,
      [33, 97, 18],
      0.6,
      [15, 84, 10],
      0.65,
      [0, 69, 0],
    ],
  },
  source: source,
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: source.getView(),
});

const output = document.getElementById('output');
function displayPixelValue(event) {
  const data = layer.getData(event.pixel);
  if (!data) {
    return;
  }
  const red = data[0];
  const nir = data[1];
  const ndvi = (nir - red) / (nir + red);
  output.textContent = ndvi.toFixed(2);
}
map.on(['pointermove', 'click'], displayPixelValue);
