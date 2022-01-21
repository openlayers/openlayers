import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WKB from '../src/ol/format/WKB.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

const wkb =
  '010A0000000200000001090000000200000001080000000500000000000000000000000000000000000000000000000000004000000000000000000000000000000040000000000000F03F00000000000000400000000000000840000000000000104000000000000008400102000000040000000000000000001040000000000000084000000000000010400000000000001440000000000000F03F000000000000104000000000000000000000000000000000010800000005000000333333333333FB3F000000000000F03F666666666666F63F9A9999999999D93F9A9999999999F93F9A9999999999D93F9A9999999999F93F000000000000E03F333333333333FB3F000000000000F03F\n';

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
    center: [0, 0],
    zoom: 4,
  }),
});
