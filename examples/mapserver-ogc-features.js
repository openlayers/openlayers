import GeoJSON from 'ol/format/GeoJSON.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import {bbox as bboxStrategy} from 'ol/loadingstrategy.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import {Fill, Stroke, Style} from 'ol/style';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';

const mapServerUrl = `https://demo.mapserver.org/cgi-bin/mapserv/localdemo/ogcapi/collections/lakes/items`;
const params = `f=json&limit=1000`;

const lakeStyle = new Style({
  fill: new Fill({
    color: 'rgba(70, 130, 180, 0.6)',
  }),
  stroke: new Stroke({
    color: 'rgba(25, 25, 112, 1)',
    width: 2,
  }),
});

const layer = new VectorLayer({
  style: lakeStyle,
  source: new VectorSource({
    url: function (extent) {
      const extentString = extent.join(',');
      const url = `${mapServerUrl}?${params}&bbox=${extentString}`;
      return url;
    },
    strategy: bboxStrategy,
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [
    new TileLayer({
      className: 'bw',
      source: new OSM(),
    }),
    layer,
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 4,
  }),
});
