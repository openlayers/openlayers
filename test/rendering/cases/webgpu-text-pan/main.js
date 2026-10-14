import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  // Outside the 100px declutter padding, inside the geometry kept for a short
  // pan, and on screen after moving north by more than that padding. The
  // buffers stay put, so only a new placement can draw the label.
  const layer = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [
        new Feature({
          geometry: new Point([0, 0]),
          name: 'South',
        }),
        new Feature({
          geometry: new Point([0, 256]),
          name: 'North',
        }),
      ],
    }),
    declutter: true,
    style: {
      'circle-radius': 24,
      'circle-fill-color': '#c40',
      'text-value': ['get', 'name'],
      'text-font': '16px sans-serif',
      'text-offset-y': -18,
      'text-fill-color': '#111',
      'text-stroke-color': '#fff',
      'text-stroke-width': 3,
    },
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

  map.on('rendercomplete', function onSouth() {
    const renderer = layer.getRenderer();
    const labels = renderer?.labelView_?.labels;
    const visibility = renderer?.visibility_;
    if (!renderer?.helper || !labels || !visibility) {
      return;
    }
    const south = labels.findIndex((label) => label.text === 'South');
    const north = labels.findIndex((label) => label.text === 'North');
    if (south < 0 || north < 0 || !visibility[south] || visibility[north]) {
      return;
    }
    map.un('rendercomplete', onSouth);
    map.getView().setCenter([0, 155]);
    map.once('rendercomplete', function () {
      render({
        message: 'A label that pans into view is drawn',
        tolerance: 0.01,
      });
    });
  });
}
