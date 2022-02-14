import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import WKB from '../src/ol/format/WKB.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

const wkb = [
  // Multi curve with line string and circular string
  '010B000000020000000102000000020000000000000000000000000000000000000000000000000014400000000000001440010800000003000000000000000000104000000000000000000000000000001040000000000000104000000000000020400000000000001040',
];

const format = new WKB();

const features = [];
wkb.forEach((geometry) => {
  features.push(
    format.readFeature(geometry, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    })
  );
});

const vector = new VectorLayer({
  source: new VectorSource({
    features: features,
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
