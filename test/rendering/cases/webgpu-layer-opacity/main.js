import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGPUVectorLayer from '../../../../src/ol/layer/WebGPUVector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

/**
 * @param {number} min Minimum x and y.
 * @param {number} max Maximum x and y.
 * @return {Polygon} Square ring.
 */
function square(min, max) {
  return new Polygon([
    [
      [min, min],
      [max, min],
      [max, max],
      [min, max],
      [min, min],
    ],
  ]);
}

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  // The white square covers the blue background. Layer opacity has to fade
  // that result, or the square blends with the blue as well as the red.
  const under = new WebGPUVectorLayer({
    source: new VectorSource({
      features: [new Feature(square(-200, 200))],
    }),
    style: {
      'fill-color': '#c00',
    },
  });
  const over = new WebGPUVectorLayer({
    opacity: 0.5,
    background: '#00f',
    source: new VectorSource({
      features: [new Feature(square(-40, 40))],
    }),
    style: {
      'fill-color': '#fff',
    },
  });

  const map = new Map({
    pixelRatio: 1,
    layers: [under, over],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!under.getRenderer()?.helper || !over.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      tolerance: 0.01,
      message: 'A translucent layer fades its background and features together',
    });
  });
}
