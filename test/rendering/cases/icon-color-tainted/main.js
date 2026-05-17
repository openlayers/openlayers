import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';
import {Layer, Vector as VectorLayer} from '../../../../src/ol/layer.js';
import {Vector as VectorSource} from '../../../../src/ol/source.js';
import {createCanvasContext2D} from '../../../../src/ol/dom.js';

// Simulate tainted canvas
const getImageData = CanvasRenderingContext2D.prototype.getImageData;
CanvasRenderingContext2D.prototype.getImageData = function () {
  throw new DOMException();
};

class WebGLLayer extends Layer {
  constructor(options) {
    super(options);
    this.style = options.style;
  }
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style: this.style,
    });
  }
}

const ctx = createCanvasContext2D(64, 64);
const data0 = ctx.createImageData(64, 64);
const data = data0.data;
for (let j = 0; j < 64; ++j) {
  for (let i = 0; i < 64; ++i) {
    const offset = (j * 64 + i) * 4;
    data[offset] = i * 4;
    data[offset + 1] = i * 4;
    data[offset + 2] = i * 4;
    data[offset + 3] = j * 4;
  }
}
ctx.putImageData(data0, 0, 0);
const src = ctx.canvas.toDataURL();

const map = new Map({
  pixelRatio: 2,
  layers: [
    new VectorLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 0, 0, 1],
      },
      source: new VectorSource({
        features: [new Feature(new Point([-40, 80]))],
      }),
    }),
    new VectorLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 0, 0, 0.25],
      },
      source: new VectorSource({
        features: [new Feature(new Point([-40, 0]))],
      }),
    }),
    new VectorLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 191, 191, 1],
      },
      source: new VectorSource({
        features: [new Feature(new Point([-40, -80]))],
      }),
    }),
    new WebGLLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 0, 0, 1],
      },
      source: new VectorSource({
        features: [new Feature(new Point([40, 80]))],
      }),
    }),
    new WebGLLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 0, 0, 0.25],
      },
      source: new VectorSource({
        features: [new Feature(new Point([40, 0]))],
      }),
    }),
    new WebGLLayer({
      style: {
        'icon-src': src,
        'icon-color': [255, 191, 191, 1],
      },
      source: new VectorSource({
        features: [new Feature(new Point([40, -80]))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

map.getTargetElement().style.background = '#00ffff40';

map.once('rendercomplete', () => {
  render();
  CanvasRenderingContext2D.prototype.getImageData = getImageData;
});
