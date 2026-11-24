import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {setDefaultRenderer} from '../../../../src/ol/renderer.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

setDefaultRenderer('webgpu');

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const layer = new TileLayer({
    source: new XYZ({
      url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
      transition: 0,
    }),
  });

  const map = new Map({
    layers: [layer],
    target: 'map',
    view: new View({
      center: [0, 0],
      zoom: 1,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper) {
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'Satellite tiles rendered with WebGPU',
    });
  });
}
