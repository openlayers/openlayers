import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Group} from '../src/ol/layer.js';
import {apply} from 'ol-mapbox-style';

const geojsonObject = {
  'type': 'FeatureCollection',
  'crs': {
    'type': 'name',
    'properties': {
      'name': 'EPSG:3857',
    },
  },
  'features': [
    {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [
          [
            [-12e6, 3.5e6],
            [-12e6, 5.5e6],
            [-10e6, 5.5e6],
            [-10e6, 3.5e6],
            [-12e6, 3.5e6],
          ],
        ],
      },
    },
  ],
};

const styles = [
  new Style({
    stroke: new Stroke({
      color: 'rgba(180, 180, 255, 1)',
      width: 1,
    }),
    fill: new Fill({
      color: 'rgba(200, 200, 255, 0.85)',
    }),
  }),
];

const source = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonObject),
});

const overlay = new VectorLayer({
  source: source,
  style: styles,
  startDeclutterGroup: true,
});

const LayerGroup = new Group();
apply(
  LayerGroup,
  'https://api.maptiler.com/maps/topo-v2/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
);

const map = new Map({
  target: 'map',
  view: new View({
    center: [-10203186.115192635, 4475744.563386],
    zoom: 4,
  }),
  layers: [LayerGroup, overlay],
});
