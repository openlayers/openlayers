import CoordinateTile from '../src/ol/source/CoordinateTile.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';

function getSubsolarPoint(t) {
  const N = Math.floor(
    (new Date(t).getTime() - Date.UTC(new Date(t).getUTCFullYear(), 0, 0)) /
      86400000,
  );

  const n = (2 * Math.PI) / 365.24;
  const declination = Math.asin(
    -0.39777249434045 * // sin(-23.44°)
      Math.cos(n * (N + 10) + 2 * 0.0167 * Math.sin(n * (N - 2))),
  );
  const latitude = (declination * 180) / Math.PI;

  const UTC_H =
    new Date(t).getUTCHours() +
    new Date(t).getUTCMinutes() / 60 +
    new Date(t).getUTCSeconds() / 3600;
  const longitude = 180 - UTC_H * 15;

  return {
    subsolarLng: longitude,
    subsolarLat: latitude,
  };
}

// ---- Earth's shadow calculation
const radians = (x) => ['/', ['*', x, Math.PI], 180];
const degrees = (x) => ['*', ['/', x, Math.PI], 180];
const arcsin = (x) => ['atan', ['/', x, ['sqrt', ['-', 1, ['*', x, x]]]]];

const subsolarLng = radians(['var', 'subsolarLng']);
const subsolarLat = radians(['var', 'subsolarLat']);
const observerLng = radians(['band', 1]);
const observerLat = radians(['band', 2]);

const Sz = [
  '+',
  ['*', ['sin', observerLat], ['sin', subsolarLat]],
  [
    '*',
    ['cos', observerLat],
    ['cos', subsolarLat],
    ['cos', ['-', subsolarLng, observerLng]],
  ],
];
const sunAltitude = degrees(arcsin(Sz));

// shadow config
const twilightStartDegrees = 0;
const twilightStepDegrees = 6;
const twilightSteps = 0;
const twilightAttenuation = 0.5;

let twilightLevel = [
  '/',
  ['-', ['-', 0, sunAltitude], twilightStartDegrees],
  twilightStepDegrees,
];
if (twilightSteps > 0) {
  twilightLevel = ['ceil', ['clamp', twilightLevel, 0, twilightSteps]];
}

const brightness = ['clamp', ['^', twilightAttenuation, twilightLevel], 0, 1];
const darkness = ['-', 1, brightness];

const color = ['color', 0, 0, 0, darkness];
// ----

const shadowLayer = new TileLayer({
  source: new CoordinateTile(),
  style: {
    color,
    variables: getSubsolarPoint(Date.now()),
  },
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    shadowLayer,
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const datetime = document.getElementById('datetime');
datetime.addEventListener('change', () => {
  const t = datetime.value || new Date();
  shadowLayer.updateStyleVariables(getSubsolarPoint(t));
});
