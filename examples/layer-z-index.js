import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

const styles = {
  square: {
    'shape-points': 4,
    'shape-radius': 80,
    'shape-angle': Math.PI / 4,
    'shape-stroke-color': 'black',
    'shape-stroke-width': 1,
    'shape-fill-color': 'blue',
  },
  triangle: {
    'shape-points': 3,
    'shape-radius': 80,
    'shape-rotation': Math.PI / 4,
    'shape-stroke-color': 'black',
    'shape-stroke-width': 1,
    'shape-fill-color': 'red',
  },
  star: {
    'shape-points': 5,
    'shape-radius': 80,
    'shape-radius2': 40,
    'shape-rotation': Math.PI / 4,
    'shape-stroke-color': 'black',
    'shape-stroke-width': 1,
    'shape-fill-color': 'green',
  },
};

function createLayer(coordinates, style, zIndex) {
  const feature = new Feature(new Point(coordinates));

  const source = new VectorSource({
    features: [feature],
  });

  const vectorLayer = new VectorLayer({
    source: source,
    style,
  });
  vectorLayer.setZIndex(zIndex);

  return vectorLayer;
}

const layer0 = createLayer([40, 40], styles.star);
const layer1 = createLayer([0, 0], styles.square, 1);
const layer2 = createLayer([0, 40], styles.triangle, 0);

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
