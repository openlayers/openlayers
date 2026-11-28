import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {
  get as getProjection,
  transform,
  transformExtent,
} from '../../../../src/ol/proj.js';
import {setDefaultRenderer} from '../../../../src/ol/renderer.js';
import Static from '../../../../src/ol/source/ImageStatic.js';

setDefaultRenderer('webgpu');

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const center = transform([-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857');
  const extent = transformExtent(
    [-123.1, 37.1, -122.1, 37.9],
    'EPSG:4326',
    'EPSG:3857',
  );

  const layer = new ImageLayer({
    source: new Static({
      url: '/data/tiles/osm/5/5/12.png',
      imageExtent: transformExtent(
        [-123, 37, -122, 38],
        'EPSG:4326',
        'EPSG:3857',
      ),
      projection: getProjection('EPSG:3857'),
    }),
    extent,
  });

  const map = new Map({
    pixelRatio: 1,
    target: 'map',
    layers: [layer],
    view: new View({
      center,
      zoom: 8,
      rotation: Math.PI / 4,
    }),
  });

  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message:
        'An image layer is drawn rotated and clipped to the layer extent',
    });
  });
}
