import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, RegularShape, Stroke, Style} from '../src/ol/style.js';

const stroke = new Stroke({color: 'black', width: 1});

const styles = {
  'square': new Style({
    image: new RegularShape({
      fill: new Fill({color: 'blue'}),
      stroke: stroke,
      points: 4,
      radius: 80,
      angle: Math.PI / 4,
    }),
  }),
  'triangle': new Style({
    image: new RegularShape({
      fill: new Fill({color: 'red'}),
      stroke: stroke,
      points: 3,
      radius: 80,
      rotation: Math.PI / 4,
      angle: 0,
    }),
  }),
  'star': new Style({
    image: new RegularShape({
      fill: new Fill({color: 'green'}),
      stroke: stroke,
      points: 5,
      radius: 80,
      radius2: 4,
      angle: 0,
    }),
  }),
};

function createLayer(coordinates, style, zIndex) {
  const feature = new Feature(new Point(coordinates));
  feature.setStyle(style);

  const source = new VectorSource({
    features: [feature],
  });

  const vectorLayer = new VectorLayer({
    source: source,
  });
  vectorLayer.setZIndex(zIndex);

  return vectorLayer;
}

const layer0 = createLayer([40, 40], styles['star']);
const layer1 = createLayer([0, 0], styles['square'], 1);
const layer2 = createLayer([0, 40], styles['triangle'], 0);

const layers = [];
layers.push(layer1);
layers.push(layer2);

const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 18,
  }),
});

layer0.setMap(map);

function bindInputs(id, layer) {
  const idxInput = document.getElementById('idx' + id);
  idxInput.onchange = function () {
    layer.setZIndex(parseInt(this.value, 10) || 0);
  };
  idxInput.value = String(layer.getZIndex());
}
bindInputs(1, layer1);
bindInputs(2, layer2);
