import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {setDefaultRenderer} from '../../../../src/ol/renderer.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

setDefaultRenderer('webgpu');

if (!navigator.gpu || !(await navigator.gpu.requestAdapter())) {
  render({
    skip: true,
    message: 'WebGPU is not available',
  });
} else {
  const raster = new RasterSource({
    sources: [
      new XYZ({
        url: '/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0,
      }),
    ],
    threads: 0, // Avoid using workers to work with puppeteer
    operation: function (pixels) {
      const pixel = pixels[0];
      const red = pixel[0];
      pixel[0] = pixel[2];
      pixel[2] = red;
      return pixel;
    },
  });

  const layer = new ImageLayer({source: raster});
  const map = new Map({
    layers: [layer],
    target: 'map',
    view: new View({center: [0, 0], zoom: 0}),
  });
  map.on('rendercomplete', function onComplete() {
    if (!layer.getRenderer()?.helper) {
      setTimeout(() => map.render(), 50);
      return;
    }
    map.un('rendercomplete', onComplete);
    render({
      message: 'A raster source on a WebGPU image layer, with a WebGPU input',
    });
  });
}
