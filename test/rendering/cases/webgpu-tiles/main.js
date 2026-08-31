import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import WebGPUTileLayer from '../../../../src/ol/layer/WebGPUTile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

if (!navigator.gpu) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const layer = new WebGPUTileLayer({
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
