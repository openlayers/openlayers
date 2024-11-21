import Feature from '../../../../src/ol/Feature.js';
import Layer from '../../../../src/ol/layer/Layer.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import WebGLVectorLayerRenderer from '../../../../src/ol/renderer/webgl/VectorLayer.js';

const openLine = new Feature({
  geometry: new LineString(
    [
      [-20, -80, 0],
      [-90, -80, 10],
      [-90, 80, 90],
      [-20, 80, 100],
    ],
    'XYM',
  ),
  limit: 5,
});

const polygon = new Feature({
  geometry: new Polygon(
    [
      [
        [20, -80, 1, 0],
        [90, -80, 2, 10],
        [90, 80, 3, 90],
        [20, 80, 4, 100],
        [20, -80, 1, 110],
      ],
    ],
    'XYZM',
  ),
  limit: 80,
});

const point = new Feature({
  geometry: new Point([50, 0]),
});
const filterAbove = {
  'stroke-color': 'rgb(255,64,64)',
  'stroke-width': 12,
  'stroke-line-join': 'miter',
  'stroke-line-cap': 'butt',
  filter: ['<', ['line-metric'], ['get', 'limit']],
};
const widthChanges = {
  'stroke-color': 'rgb(60,222,4)',
  'stroke-offset': 10,
  'stroke-width': ['case', ['>', ['line-metric'], 60], 2, 8],
  'stroke-line-join': 'miter',
  'stroke-line-cap': 'butt',
};
const colorInterpolation = {
  'stroke-color': [
    'interpolate',
    ['linear'],
    ['line-metric'],
    0,
    'rgb(0,49,152)',
    110,
    'rgb(176,148,9)',
  ],
  'stroke-line-cap': 'butt',
  'stroke-line-join': 'miter',
  'stroke-offset': -10,
  'stroke-width': 8,
};
const shouldNotShowUp = {
  'fill-color': ['*', 'rgb(126,35,144)', ['line-metric']],
  'circle-fill-color': ['*', 'rgb(126,35,144)', ['line-metric']],
  'circle-radius': 20,
};

const style = [filterAbove, widthChanges, colorInterpolation, shouldNotShowUp];

class WebGLLayer extends Layer {
  createRenderer() {
    return new WebGLVectorLayerRenderer(this, {
      style,
    });
  }
}

const vector = new WebGLLayer({
  source: new VectorSource({
    features: [openLine, polygon, point],
  }),
});

new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    zoom: 1,
  }),
});

render({
  message:
    'renders two lines side-by-side, styles using the line-metric operator',
});
