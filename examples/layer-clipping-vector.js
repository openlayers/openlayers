import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import VectorSource from '../src/ol/source/Vector.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import OSM from '../src/ol/source/OSM.js';
import {Fill, Style} from '../src/ol/style.js';
import {getVectorContext} from '../src/ol/render.js';
import {fromLonLat} from '../src/ol/proj.js';

const base = new TileLayer({
  source: new OSM()
});

const clipLayer = new VectorLayer({
  style: null,
  source: new VectorSource({
    url:
    './data/geojson/switzerland.geojson',
    format: new GeoJSON()
  })
});

const style = new Style({
  fill: new Fill({
    color: 'black'
  })
});

base.on('postrender', function(e) {
  e.context.globalCompositeOperation = 'destination-in';
  const vectorContext = getVectorContext(e);
  clipLayer.getSource().forEachFeature(function(feature) {
    vectorContext.drawFeature(feature, style);
  });
  e.context.globalCompositeOperation = 'source-over';
});

const map = new Map({
  layers: [base, clipLayer],
  target: 'map',
  view: new View({
    center: fromLonLat([8.23, 46.86]),
    zoom: 7
  })
});
