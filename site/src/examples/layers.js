import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import GeoJSON from '../../../src/ol/format/GeoJSON.js';
import {
  Tile as TileLayer,
  Vector as VectorLayer
} from '../../../src/ol/layer.js';
import {BingMaps, Vector as VectorSource} from '../../../src/ol/source.js';
import {Style, Stroke} from '../../../src/ol/style.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    }),
    new VectorLayer({
      source: new VectorSource({
        format: new GeoJSON(),
        url:
          'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
      }),
      opacity: 0.5,
      style: new Style({
        stroke: new Stroke({
          width: 1.25,
          color: 'lightgrey'
        })
      })
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
