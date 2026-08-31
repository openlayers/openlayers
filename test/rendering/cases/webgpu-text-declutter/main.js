import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const source = new VectorSource();
  for (let i = 0; i < 8; ++i) {
    source.addFeature(
      new Feature({
        geometry: new Point([-40 + i * 12, 20]),
        name: 'P' + i,
      }),
    );
  }
  source.addFeature(
    new Feature({
      geometry: new LineString([
        [-50, -30],
        [50, -30],
      ]),
      name: 'line-label',
    }),
  );

  const extra = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature({
          geometry: new Point([0, -10]),
          name: 'wrapped WebGPU label',
        }),
      ],
    }),
    declutter: 'group',
    style: {
      'circle-radius': 4,
      'circle-fill-color': '#00aa00',
      'text-value': ['get', 'name'],
      'text-font': '12px sans-serif',
      'text-max-width': 70,
      'text-fill-color': '#060',
    },
  });
  const layer = new WebGPUVectorLayer({
    source,
    declutter: 'group',
    style: [
      {
        filter: ['==', ['geometry-type'], 'LineString'],
        style: {
          'stroke-color': '#319FD3',
          'stroke-width': 2,
          'text-value': ['get', 'name'],
          'text-font': '12px sans-serif',
          'text-placement': 'line',
          'text-fill-color': '#000',
          'text-stroke-color': '#fff',
          'text-stroke-width': 2,
        },
      },
      {
        else: true,
        style: {
          'circle-radius': 6,
          'circle-fill-color': '#ff9900',
          'text-value': ['get', 'name'],
          'text-font': '12px sans-serif',
          'text-offset-y': -12,
          'text-fill-color': '#000',
          'text-stroke-color': '#fff',
          'text-stroke-width': 2,
        },
      },
    ],
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [layer, extra],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper || !extra.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'Overlapping, wrapped, and line labels are decluttered',
      tolerance: 0.02,
    });
  });
}
