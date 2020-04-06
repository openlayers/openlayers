import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {
  Modify,
  Select,
  defaults as defaultInteractions,
} from '../src/ol/interaction.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

const raster = new TileLayer({
  source: new OSM(),
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON(),
    wrapX: false,
  }),
});

const select = new Select({
  wrapX: false,
});

const modify = new Modify({
  features: select.getFeatures(),
});

const map = new Map({
  interactions: defaultInteractions().extend([select, modify]),
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
