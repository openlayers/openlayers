import Flow from '../src/ol/layer/Flow.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Interpolated from '../src/ol/source/Interpolated.js';
import Map from '../src/ol/Map.js';
import Vector from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';

const data = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        u: 10,
        v: 10,
      },
      geometry: {
        type: 'Point',
        coordinates: [-40, 20],
      },
    },
    {
      type: 'Feature',
      properties: {
        u: 10,
        v: -10,
      },
      geometry: {
        type: 'Point',
        coordinates: [40, 20],
      },
    },
    {
      type: 'Feature',
      properties: {
        u: 12,
        v: -12,
      },
      geometry: {
        type: 'Point',
        coordinates: [40, -20],
      },
    },
    {
      type: 'Feature',
      properties: {
        u: 5,
        v: 20,
      },
      geometry: {
        type: 'Point',
        coordinates: [-40, -20],
      },
    },
  ],
};

const format = new GeoJSON({
  featureProjection: 'EPSG:3857',
});

const features = format.readFeatures(data);

const maxValue = 40;
const numValues = 4;
const values = new Array(numValues).fill(0);

function stretch(value) {
  if (value < -maxValue) {
    return 0;
  }
  if (value > maxValue) {
    return 255;
  }
  return Math.round((255 * (value + maxValue)) / (2 * maxValue));
}

const wind = new Interpolated({
  source: new Vector({features}),
  valueCount: 4,
  values: (feature) => {
    values[0] = stretch(feature.get('u'));
    values[1] = stretch(feature.get('v'));
    values[3] = 1;
    return values;
  },
});

const map = new Map({
  target: 'map',
  layers: [
    new Flow({
      source: wind,
      style: {
        color: [
          'interpolate',
          ['linear'],
          ['get', 'speed'],
          0,
          '#34618d',
          0.1,
          '#2c718e',
          0.2,
          '#27818e',
          0.3,
          '#21908d',
          0.4,
          '#27ad81',
          0.5,
          '#42bb72',
          0.6,
          '#5cc863',
          0.7,
          '#83d24b',
          0.8,
          '#aadc32',
          0.9,
          '#d4e22c',
          1,
          '#fde725',
        ],
      },
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 0,
  }),
});
