import {Feature, Map, View} from '../src/ol/index.js';
import {Group as LayerGroup, Vector as VectorLayer} from '../src/ol/layer.js';
import {Vector as VectorSource} from '../src/ol/source.js';
import {apply} from 'ol-mapbox-style';
import {fromExtent} from '../src/ol/geom/Polygon.js';
import {getCenter} from '../src/ol/extent.js';

const square = [-12e6, 3.5e6, -10e6, 5.5e6];
const overlay = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(fromExtent(square))],
  }),
  style: {
    'stroke-color': 'rgba(180, 180, 255, 1)',
    'stroke-width': 1,
    'fill-color': 'rgba(200, 200, 255, 0.85)',
  },
});

const layer = new LayerGroup();
apply(
  layer,
  'https://api.maptiler.com/maps/topo-v2/style.json?key=get_your_own_D6rA4zTHduk6KOKTXzGB'
);

const map = new Map({
  target: 'map',
  view: new View({
    center: getCenter(square),
    zoom: 4,
  }),
  layers: [layer, overlay],
});

overlay.on('prerender', () => map.flushDeclutterItems());
