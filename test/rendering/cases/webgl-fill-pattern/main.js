import Feature from '../../../../src/ol/Feature.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import Map from '../../../../src/ol/Map.js';
import Polygon from 'ol/geom/Polygon.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';

const polygon1 = new Feature({
  geometry: new Polygon([
    [
      [-100, -100],
      [-10, -100],
      [-10, -10],
      [-100, -10],
      [-100, -100],
    ],
  ]),
});
const polygon2 = new Feature({
  geometry: new Polygon([
    [
      [100, -100],
      [10, -100],
      [10, -10],
      [100, -10],
      [100, -100],
    ],
  ]),
});
const polygon3 = new Feature({
  geometry: new Polygon([
    [
      [-100, 100],
      [100, 100],
      [100, 10],
      [-100, 10],
      [-100, 100],
    ],
  ]),
});

// create pattern
const canvas = document.createElement('canvas');
canvas.width = 36;
canvas.height = 36;
const context = canvas.getContext('2d');
const gradient = context.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, 'rgba(11,152,167,1)');
gradient.addColorStop(1, 'rgba(255,0,204,1)');
context.fillStyle = gradient;
context.fillRect(2, 2, 32, 32);

const srcPattern = {
  'fill-pattern-src': '/data/fish.png',
};
const imagePattern = {
  'fill-pattern-src': canvas.toDataURL('png'),
  'fill-pattern-offset': [2, 2],
  'fill-pattern-size': [32, 32],
};
const subImageTint = {
  'fill-pattern-src': '/data/sprites/bright-v9/sprite.png',
  'fill-pattern-offset': [21, 0],
  'fill-pattern-offset-origin': 'top-right',
  'fill-pattern-size': [21, 21],
  'fill-color': 'red',
};

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style: this.get('style'),
    });
  }
}

const vector1 = new WebGLLayer({
  style: srcPattern,
  source: new VectorSource({
    features: [polygon1],
  }),
});
const vector2 = new WebGLLayer({
  style: imagePattern,
  source: new VectorSource({
    features: [polygon2],
  }),
});
const vector3 = new WebGLLayer({
  style: subImageTint,
  source: new VectorSource({
    features: [polygon3],
  }),
});

const map = new Map({
  layers: [vector1, vector2, vector3],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    zoom: 1,
  }),
});

map.once('rendercomplete', () => {
  render({
    message: 'renders four polygons with various pattern fills',
  });
});
