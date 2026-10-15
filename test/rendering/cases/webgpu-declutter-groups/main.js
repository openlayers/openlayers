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
  /**
   * @param {string} declutter Declutter group.
   * @param {number} x Point x.
   * @param {string} text Label.
   * @param {string} fill Circle fill.
   * @param {number} radius Circle radius.
   * @param {number} offsetY Label offset.
   * @return {WebGPUVectorLayer} Layer.
   */
  function layer(declutter, x, text, fill, radius, offsetY) {
    return new WebGPUVectorLayer({
      declutter,
      source: new VectorSource({
        features: [new Feature(new Point([x, 0]))],
      }),
      style: {
        'circle-radius': radius,
        'circle-fill-color': fill,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'text-value': text,
        'text-font': 'bold 18px sans-serif',
        'text-fill-color': '#111111',
        'text-stroke-color': '#ffffff',
        'text-stroke-width': 3,
        'text-offset-y': offsetY,
      },
    });
  }

  // Same point, same group: the higher layer claims the space, so the large
  // red circle and LOW are not drawn.
  const sharedLower = layer('towns', -64, 'LOW', '#e11d48', 32, 0);
  const sharedUpper = layer('towns', -64, 'HIGH', '#1d4ed8', 12, 0);
  // Same point, different groups: both symbols and both labels are drawn.
  const separateLower = layer('alpha', 64, 'ONE', '#f59e0b', 32, 40);
  const separateUpper = layer('beta', 64, 'TWO', '#059669', 12, -40);

  const layers = [sharedLower, separateLower, sharedUpper, separateUpper];
  const map = new Map({
    pixelRatio: 1,
    layers,
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    for (const item of layers) {
      const renderer = item.getRenderer();
      if (!renderer?.helper || !renderer.buffers_?.commands?.length) {
        return;
      }
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'One declutter group collides across layers; a different group does not',
      tolerance: 0.02,
    });
  });
}
