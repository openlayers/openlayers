import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const bottom = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature(
          new Polygon([
            [
              [-110, -110],
              [110, -110],
              [110, 110],
              [-110, 110],
              [-110, -110],
            ],
          ]),
        ),
      ],
    }),
    style: {
      'fill-color': '#c41e3a',
    },
  });

  const middle = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([
            [
              [-70, -70],
              [70, -70],
              [70, 70],
              [-70, 70],
              [-70, -70],
            ],
          ]),
          kind: 'fill',
        }),
        new Feature({
          geometry: new Point([-40, 40]),
          kind: 'symbol',
        }),
        new Feature({
          geometry: new Point([0, 0]),
          kind: 'label',
        }),
      ],
    }),
    declutter: true,
    style: [
      {
        filter: ['==', ['get', 'kind'], 'fill'],
        style: {
          'fill-color': '#ff9900',
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'symbol'],
        style: {
          'circle-radius': 16,
          'circle-fill-color': '#1d4ed8',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      },
      {
        filter: ['==', ['get', 'kind'], 'label'],
        style: {
          'text-value': 'WESTEAST',
          'text-font': 'bold 24px sans-serif',
          'text-fill-color': '#111111',
          'text-stroke-color': '#ffffff',
          'text-stroke-width': 3,
        },
      },
    ],
  });

  const top = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature(
          new Polygon([
            [
              [8, -90],
              [40, -90],
              [40, 90],
              [8, 90],
              [8, -90],
            ],
          ]),
        ),
      ],
    }),
    style: {
      'fill-color': '#1a7f37',
    },
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [bottom, middle, top],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    const middleRenderer = middle.getRenderer();
    if (
      !bottom.getRenderer()?.helper ||
      !middleRenderer?.helper ||
      !middleRenderer.buffers_?.commands?.length ||
      !top.getRenderer()?.helper
    ) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'Higher geometry covers lower labels; symbols stay above their own fill',
      tolerance: 0.02,
    });
  });
}
