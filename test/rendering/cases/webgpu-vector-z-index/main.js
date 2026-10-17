import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const low = new Feature({
    geometry: new Polygon([
      [
        [-40, -40],
        [20, -40],
        [20, 20],
        [-40, 20],
        [-40, -40],
      ],
    ]),
    kind: 'low',
  });
  const high = new Feature({
    geometry: new Polygon([
      [
        [0, -20],
        [40, -20],
        [40, 40],
        [0, 40],
        [0, -20],
      ],
    ]),
    kind: 'high',
  });
  const under = new Feature({
    geometry: new Point([10, -10]),
    kind: 'under',
  });
  const over = new Feature({
    geometry: new Point([30, 30]),
    kind: 'over',
  });

  const layer = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [low, under, high, over],
    }),
    declutter: true,
    style: [
      {
        filter: ['==', ['get', 'kind'], 'low'],
        style: {
          'fill-color': '#c41e3a',
          'z-index': 0,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'high'],
        style: {
          'fill-color': '#1d4ed8',
          'z-index': 5,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'under'],
        style: {
          'text-value': 'under',
          'text-font': 'bold 18px sans-serif',
          'text-fill-color': '#fff',
          'z-index': 0,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'over'],
        style: {
          'text-value': 'over',
          'text-font': 'bold 18px sans-serif',
          'text-fill-color': '#ffe14a',
          'z-index': 6,
        },
      },
    ],
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [layer],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    const renderer = layer.getRenderer();
    if (!renderer?.helper || !renderer.buffers_?.commands?.length) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'A higher z-index polygon covers a lower label, and a higher label stays on top',
      tolerance: 0.02,
    });
  });
}
