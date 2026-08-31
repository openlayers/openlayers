import {assert} from 'chai';
import {WEBGPU} from '../../../../../src/ol/has.js';
import WebGPUVectorTileLayer from '../../../../../src/ol/layer/WebGPUVectorTile.js';
import WebGPUVectorTileLayerRenderer from '../../../../../src/ol/renderer/webgpu/VectorTileLayer.js';
import VectorTileSource from '../../../../../src/ol/source/VectorTile.js';

describe('ol/layer/WebGPUVectorTile', () => {
  it('creates a renderer and exposes the declutter group', function () {
    if (!WEBGPU) {
      this.skip();
    }
    const layer = new WebGPUVectorTileLayer({
      source: new VectorTileSource({
        url: 'data/{z}/{x}/{y}.pbf',
      }),
      style: {
        'fill-color': '#eee',
        'text-value': 'x',
      },
      declutter: 'tiles',
    });
    const renderer = layer.createRenderer();
    assert.instanceOf(renderer, WebGPUVectorTileLayerRenderer);
    assert.strictEqual(layer.getDeclutter(), 'tiles');
    layer.dispose();
  });
});
