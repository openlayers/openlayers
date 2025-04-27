import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';
import {Layer, Vector as VectorLayer} from '../../../../src/ol/layer.js';
import {Vector as VectorSource} from '../../../../src/ol/source.js';
import {createCanvasContext2D} from '../../../../src/ol/dom.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';

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

const polygon = fromExtent([0, 0, 64, 64]);

const offsetPolygon = (x, y) => {
  const clone = polygon.clone();
  clone.translate(x, y);
  return clone;
};

const map = new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 0, 0, 1],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(-64, 64))],
      }),
    }),
    new VectorLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 0, 0, 0.25],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(-64, 0))],
      }),
    }),
    new VectorLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 191, 191, 1],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(-64, -64))],
      }),
    }),
    new WebGLLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 0, 0, 1],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(64, 64))],
      }),
    }),
    new WebGLLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 0, 0, 0.25],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(64, 0))],
      }),
    }),
    new WebGLLayer({
      style: {
        'fill-pattern-src': src,
        'fill-color': [255, 191, 191, 1],
      },
      source: new VectorSource({
        features: [new Feature(offsetPolygon(64, -64))],
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [32, 32],
    resolution: 1,
    resolutions: [1],
  }),
});

map.getTargetElement().style.background = '#00ffff40';

render();
