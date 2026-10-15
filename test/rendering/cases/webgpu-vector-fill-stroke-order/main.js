import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  /**
   * @param {number} minX Minimum x.
   * @param {number} minY Minimum y.
   * @param {number} maxX Maximum x.
   * @param {number} maxY Maximum y.
   * @param {string} kind Feature kind.
   * @return {Feature} Polygon.
   */
  function box(minX, minY, maxX, maxY, kind) {
    return new Feature({
      geometry: new Polygon([
        [
          [minX, minY],
          [maxX, minY],
          [maxX, maxY],
          [minX, maxY],
          [minX, minY],
        ],
      ]),
      kind,
    });
  }

  const layer = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        box(-120, -100, -40, 20, 'plain-under'),
        box(-100, -40, -10, 100, 'plain-over'),
        box(10, -100, 90, 20, 'stacked-under'),
        box(30, -40, 120, 100, 'stacked-over'),
      ],
    }),
    style: [
      {
        filter: ['==', ['get', 'kind'], 'plain-under'],
        style: {
          'fill-color': '#e11d48',
          'stroke-color': '#1d4ed8',
          'stroke-width': 18,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'plain-over'],
        style: {
          'fill-color': '#f59e0b',
          'stroke-color': '#111111',
          'stroke-width': 18,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'stacked-under'],
        style: {
          'z-index': 0,
          'fill-color': '#16a34a',
          'stroke-color': '#1d4ed8',
          'stroke-width': 18,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'stacked-over'],
        style: {
          'z-index': 1,
          'fill-color': '#f59e0b',
          'stroke-color': '#111111',
          'stroke-width': 18,
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
        'A shared z-index paints every fill before any stroke; a higher z-index keeps the later feature on top',
      tolerance: 0.02,
    });
  });
}
