import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

// Original dotted gray style for all geometries
const originalLineStyle = new Style({
  stroke: new Stroke({color: '#aaa', width: 1, lineDash: [3, 3]}),
});

// Style for offset lines
const offsetLineStyle = new Style({
  stroke: new Stroke({color: '#f00', width: 2, offset: 10}),
});

const vectorSource = new VectorSource({
  url: '/data/rivers.geojson',
  format: new GeoJSON(),
});

// Use null style so the layer doesn't render features through the normal path
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: null,
});

// Draw features using the immediate renderer on postrender
vectorLayer.on('postrender', function (evt) {
  const context = getVectorContext(evt);
  const features = vectorSource.getFeatures();
  for (const feature of features) {
    const geometry = feature.getGeometry();
    context.setStyle(originalLineStyle);
    context.drawGeometry(geometry);
    context.setStyle(offsetLineStyle);
    context.drawGeometry(geometry);
  }
});

new Map({
  pixelRatio: 1,
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [816041.5, 6827504.5],
    resolution: 350,
  }),
});

render();
