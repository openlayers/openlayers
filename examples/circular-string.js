import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WKB from '../src/ol/format/WKB.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

const wkb =
  '01080000000300000000000000000000000000000000000000000000000000F03F000000000000F03F000000000000F03F0000000000000000';

const format = new WKB();

const feature = format.readFeature(wkb, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
});

const vector = new VectorLayer({
  source: new VectorSource({
    features: [feature],
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [2952104.0199, -3277504.823],
    zoom: 4,
  }),
});
