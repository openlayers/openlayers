import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {setDefaultRenderer} from '../../../../src/ol/renderer.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

setDefaultRenderer('webgpu');

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const vector = new VectorLayer({
    source: new VectorSource({
      features: [
        new Feature(
          new LineString([
            [-100, 0],
            [100, 0],
          ]),
        ),
      ],
    }),
    style: {
      'stroke-color': '#000',
      'stroke-width': 0.5,
    },
  });

  const map = new Map({
    layers: [vector],
    target: 'map',
    view: new View({
      center: [0, 0],
      resolution: 1,
      rotation: Math.PI / 2,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!vector.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      tolerance: 0.01,
      message:
        'A subpixel WebGPU stroke remains visible when the view is rotated',
    });
  });
}
