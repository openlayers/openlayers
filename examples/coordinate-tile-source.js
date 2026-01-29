import CoordinateTile from '../src/ol/source/CoordinateTile.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import View from '../src/ol/View.js';
import {toDegrees, toRadians} from '../src/ol/math.js';

function getSubsolarPoint(t) {
  // based on https://en.wikipedia.org/wiki/Equation_of_time#Alternative_calculation
  const D = (t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 0)) / 86400000;
  const n = (2 * Math.PI) / 365.24;

  const e = toRadians(23.44); // Earth's axial tilt
  const E = 0.0167; // Earth's orbital eccentricity

  const A = (D + 9) * n;
  const B = A + 2 * E * Math.sin((D - 3) * n);
  const C = (A - Math.atan2(Math.sin(B), Math.cos(B) * Math.cos(e))) / Math.PI;

  const EOT = 720 * (C - Math.trunc(C + 0.5));

  const UTC =
    t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600;

  const subsolarLng = -15 * (UTC - 12 + EOT / 60);
  const subsolarLat = toDegrees(Math.asin(Math.sin(-e) * Math.cos(B)));

  return {
    subsolarLng,
    subsolarLat,
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
  opacity: 0.5,
  source: new CoordinateTile(),
  style: {
    color,
    variables: getSubsolarPoint(new Date()),
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
  const t = datetime.value ? new Date(datetime.value) : new Date();
  shadowLayer.updateStyleVariables(getSubsolarPoint(t));
});
