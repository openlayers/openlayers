import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {bbox as bboxStrategy} from '../src/ol/loadingstrategy.js';

const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return (
      'https://ahocevar.com/geoserver/wfs?service=WFS&' +
      'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
      'outputFormat=application/json&srsname=EPSG:3857&' +
      'bbox=' +
      extent.join(',') +
      ',EPSG:3857'
    );
  },
  strategy: bboxStrategy,
});

const vector = new VectorLayer({
  source: vectorSource,
  style: {
    'stroke-width': 0.75,
    'stroke-color': 'white',
    'fill-color': 'rgba(100,100,100,0.25)',
  },
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const raster = new TileLayer({
  source: new XYZ({
    attributions: attributions,
    url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
    maxZoom: 20,
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: document.getElementById('map'),
  view: new View({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 12,
  }),
});
