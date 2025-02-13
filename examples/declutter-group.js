import {apply} from 'ol-mapbox-style';
import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import Point from '../src/ol/geom/Point.js';
import {fromExtent} from '../src/ol/geom/Polygon.js';
import LayerGroup from '../src/ol/layer/Group.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

const square = [-12e6, 3.5e6, -10e6, 5.5e6];
const overlay = new VectorLayer({
  declutter: 'separate',
  source: new VectorSource({
    features: [
      new Feature({
        geometry: fromExtent(square),
        text: 'Polygon above Mapbox styled layers',
      }),
      new Feature({
        geometry: new Point([-11e6, 4.3e6]),
        text: 'Point above Mapbox styled layers',
      }),
    ],
  }),
  style: {
    'stroke-color': 'rgba(180, 180, 255, 1)',
    'stroke-width': 1,
    'fill-color': 'rgba(200, 200, 255, 0.85)',
    'text-value': ['get', 'text'],
    'text-font': 'bold 14px sans-serif',
    'text-offset-y': -12,
    'text-overflow': true,
    'circle-radius': 5,
    'circle-fill-color': 'rgba(180, 180, 255, 1)',
    'circle-stroke-color': 'rgba(255, 255, 255, 1)',
  },
});

const layer = new LayerGroup();
apply(
  layer,
  'https://api.maptiler.com/maps/streets-v2/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB',
);

const map = new Map({
  target: 'map',
  view: new View({
    center: getCenter(square),
    zoom: 3.9,
  }),
  layers: [layer, overlay],
});
