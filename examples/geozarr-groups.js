import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
} from '../src/ol/View.js';
import Link from '../src/ol/interaction/Link.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

const source = new GeoZarr({
  url: 'https://s3.explorer.eopf.copernicus.eu/esa-zarr-sentinel-explorer-fra/tests-output/sentinel-2-l2a/S2B_MSIL2A_20260120T125339_N0511_R138_T27VWL_20260120T131151.zarr',
  bands: [
    {name: 'b04', group: 'measurements/reflectance'},
    {name: 'b03', group: 'measurements/reflectance'},
    {name: 'b02', group: 'measurements/reflectance'},
    {name: 'cld', group: 'quality/probability'},
  ],
});

const layer = new TileLayer({
  style: {
    variables: {threshold: 50},
    gamma: 1.5,
    color: [
      'color',
      ['interpolate', ['linear'], ['band', 1], 0, 0, 0.5, 255],
      ['interpolate', ['linear'], ['band', 2], 0, 0, 0.5, 255],
      ['interpolate', ['linear'], ['band', 3], 0, 0, 0.5, 255],
      // Hide pixels whose cloud probability exceeds the threshold.
      ['case', ['>', ['band', 4], ['var', 'threshold']], 0, 1],
    ],
  },
  source,
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    layer,
  ],
  target: 'map',
  view: getView(source, withHigherResolutions(2), withExtentCenter()),
});

map.addInteraction(new Link());

const thresholdSlider = document.getElementById('threshold');
const thresholdValue = document.getElementById('threshold-value');
thresholdSlider.addEventListener('input', function () {
  thresholdValue.textContent = thresholdSlider.value;
  layer.updateStyleVariables({threshold: parseFloat(thresholdSlider.value)});
});
