import {apply} from 'ol-mapbox-style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import LayerGroup from '../src/ol/layer/Group.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const url = 'https://api.maptiler.com/maps/basic-4326/style.json?key=' + key;

// Container for ol-mapbox-style layers
const layer = new LayerGroup();

// The layer group will be populated with a background layer and a VectorTile layer
apply(layer, url, {projection: 'EPSG:4326'});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection: 'EPSG:4326',
    zoom: 0,
    center: [0, 30],
  }),
});
