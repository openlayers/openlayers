import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import {
  getView,
  withExtentCenter,
  withHigherResolutions,
  withLowerResolutions,
} from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import {register} from '../src/ol/proj/proj4.js';
import GeoZarr from '../src/ol/source/GeoZarr.js';
import OSM from '../src/ol/source/OSM.js';

register(proj4);

// A single-band color ramp style with evenly spaced color stops.
function ramp(min, max, colors) {
  const stops = [];
  for (let i = 0; i < colors.length; i++) {
    stops.push(min + (i / (colors.length - 1)) * (max - min), colors[i]);
  }
  return {color: ['interpolate', ['linear'], ['band', 1], ...stops]};
}

// An RGB composite style stretching each band from [min, max] to 0..255.
function rgb(min, max) {
  const stretch = (band) => [
    'interpolate',
    ['linear'],
    ['band', band],
    min,
    0,
    max,
    255,
  ];
  return {color: ['color', stretch(1), stretch(2), stretch(3)]};
}

const FTW_URL =
  'https://data.source.coop/ftw/global-data/predictions/zarr/alpha/global.zarr';

const datasets = {
  'ftw-rgb': {
    source: {
      url: FTW_URL,
      variable: 'variables',
      // The three class probabilities as RGB, for the most recent year
      dimensions: {band: [0, 1, 2], time: 1},
    },
    style: rgb(0, 0.5),
  },
  'ftw-field-2024': {
    source: {
      url: FTW_URL,
      variable: 'variables',
      dimensions: {band: [1], time: 0}, // band 1 is the `field` probability
    },
    style: ramp(0, 1, [
      [255, 255, 178],
      [0, 104, 55],
    ]),
  },
  'usgs-dem': {
    source: {
      url: 'https://carbonplan-share.s3.us-west-2.amazonaws.com/zarr-layer-examples/USGS-CONUS-DEM-10m.zarr',
      variable: 'DEM',
    },
    style: ramp(0, 3500, [
      [26, 152, 80],
      [254, 224, 139],
      [140, 81, 10],
      [255, 255, 255],
    ]),
  },
  'hurricane': {
    source: {
      url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/hurricanes/era5/florence',
      variable: 'surface_pressure',
      dimensions: {time: 0},
    },
    style: ramp(96000, 103000, [
      [68, 1, 84],
      [33, 145, 140],
      [253, 231, 37],
    ]),
  },
  'antarctic-era5': {
    source: {
      url: 'https://carbonplan-share.s3.us-west-2.amazonaws.com/zarr-layer-examples/antarctic_era5.zarr',
      variable: 'wind_speed',
    },
    style: ramp(0, 12, [
      [247, 251, 255],
      [107, 174, 214],
      [8, 48, 107],
    ]),
  },
  'polar': {
    source: {
      url: 'https://carbonplan-share.s3.us-west-2.amazonaws.com/zarr-layer-examples/polar-subset.zarr',
      variable: 'velocity',
    },
    style: ramp(0, 1, [
      [255, 245, 240],
      [251, 106, 74],
      [103, 0, 13],
    ]),
  },
  'fgco2': {
    source: {
      url: 'https://carbonplan-oae-efficiency.s3.us-west-2.amazonaws.com/fgco2-2021-180x360.zarr',
      variable: 'FG_CO2_2',
      dimensions: {time: 0},
      // The store has neither spatial metadata nor coordinate arrays, so the
      // extent and the south-up orientation have to be provided.
      extent: [-180, -90, 180, 90],
      flipY: true,
    },
    style: ramp(-5, 5, [
      [230, 97, 1],
      [255, 255, 255],
      [5, 113, 176],
    ]),
  },
  'carbonplan-4d': {
    source: {
      url: 'https://carbonplan-maps.s3.us-west-2.amazonaws.com/v2/demo/4d/tavg-prec-month',
      variable: 'climate',
      // Bands can also be selected by coordinate label
      dimensions: {band: ['tavg'], month: 0},
    },
    style: ramp(-30, 30, [
      [5, 113, 176],
      [255, 255, 255],
      [202, 0, 32],
    ]),
  },
  'cmip6-tasmax': {
    source: {
      url: 'https://carbonplan-benchmarks.s3.us-west-2.amazonaws.com/data/NEX-GDDP-CMIP6/ACCESS-CM2/historical/r1i1p1f1/tasmax/tasmax_day_ACCESS-CM2_historical_r1i1p1f1_gn/pyramids-v2-4326-True-128-1-0-0-f4-0-0-0-gzipL1-100',
      variable: 'tasmax',
      dimensions: {time: 0},
    },
    style: ramp(250, 320, [
      [5, 113, 176],
      [255, 255, 255],
      [253, 174, 97],
      [165, 0, 38],
    ]),
  },
  'tos-con': {
    source: {
      url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/noc-npd-era5-demo/npd-eorca1-era5v1/gn/T1y/tos_con',
      variable: 'tos_con',
      dimensions: {time: 0},
    },
    style: ramp(-2, 30, [
      [5, 48, 97],
      [247, 247, 247],
      [178, 24, 43],
    ]),
  },
};

const select = document.getElementById('dataset-select');

let map;

function render() {
  const dataset = datasets[select.value];

  const source = new GeoZarr(dataset.source);

  if (map) {
    map.setTarget(null);
  }

  map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      new TileLayer({
        style: dataset.style,
        source,
      }),
    ],
    target: 'map',
    view: getView(
      source,
      withLowerResolutions(2),
      withHigherResolutions(2),
      withExtentCenter(),
    ),
  });
}

select.addEventListener('change', render);

render();
