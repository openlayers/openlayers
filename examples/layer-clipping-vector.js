import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {Fill, Style} from '../src/ol/style.js';
import {OSM, Stamen, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {getVectorContext} from '../src/ol/render.js';

//A distinct className is required to use another canvas for the background
const background = new TileLayer({
  className: 'stamen',
  source: new Stamen({
    layer: 'toner',
  }),
});

const base = new TileLayer({
  source: new OSM(),
});

const clipLayer = new VectorLayer({
  style: null,
  source: new VectorSource({
    url: './data/geojson/switzerland.geojson',
    format: new GeoJSON(),
  }),
});

//Giving the clipped layer an extent is necessary to avoid rendering when the feature is outside the viewport
clipLayer.getSource().on('addfeature', function () {
  base.setExtent(clipLayer.getSource().getExtent());
});

const style = new Style({
  fill: new Fill({
    color: 'black',
  }),
});

base.on('postrender', function (e) {
  const vectorContext = getVectorContext(e);
  e.context.globalCompositeOperation = 'destination-in';
  clipLayer.getSource().forEachFeature(function (feature) {
    vectorContext.drawFeature(feature, style);
  });
  e.context.globalCompositeOperation = 'source-over';
});

const map = new Map({
  layers: [background, base, clipLayer],
  target: 'map',
  view: new View({
    center: fromLonLat([8.23, 46.86]),
    zoom: 7,
  }),
});
