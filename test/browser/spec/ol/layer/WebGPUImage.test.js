import {assert} from 'chai';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import {setDefaultRenderer} from '../../../../../src/ol/renderer.js';
import CanvasImageLayerRenderer from '../../../../../src/ol/renderer/canvas/ImageLayer.js';
import WebGPUImageLayerRenderer from '../../../../../src/ol/renderer/webgpu/ImageLayer.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';

beforeAll(() => {
  setDefaultRenderer('webgpu');
  return loadRenderers('webgpu');
});
afterAll(() => setDefaultRenderer('canvas'));

where('WebGPU').describe('ol/layer/WebGPUImage', function () {
  /** @type {Map} */
  let map;

  afterEach(function () {
    disposeMap(map);
  });

  it('uses the renderer option over the default renderer', () => {
    const layer = new ImageLayer({renderer: 'canvas'});
    assert.instanceOf(layer.getRenderer(), CanvasImageLayerRenderer);
    layer.dispose();
  });

  it('reads pixel data from the rendered image', async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    context.fillStyle = '#f00';
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = '#00f';
    context.fillRect(1, 0, 1, 1);
    const layer = new ImageLayer({
      source: new Static({
        url: canvas.toDataURL(),
        imageExtent: [-50, -25, 50, 25],
      }),
    });
    map = new Map({
      target: createMapDiv(100, 100),
      pixelRatio: 1,
      layers: [layer],
      view: new View({center: [0, 0], resolution: 1}),
    });
    await new Promise((resolve) => map.once('rendercomplete', resolve));
    assert.instanceOf(layer.getRenderer(), WebGPUImageLayerRenderer);
    assert.deepEqual(Array.from(layer.getData([25, 50])), [255, 0, 0, 255]);
    assert.deepEqual(Array.from(layer.getData([75, 50])), [0, 0, 255, 255]);
    assert.isNull(layer.getData([50, 10]));
  });
});
