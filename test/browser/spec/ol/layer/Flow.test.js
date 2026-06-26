import {assert} from 'chai';
import FlowLayer from '../../../../../src/ol/layer/Flow.js';
import FlowLayerRenderer from '../../../../../src/ol/renderer/webgl/FlowLayer.js';
import DataTileSource from '../../../../../src/ol/source/DataTile.js';

describe('ol/layer/Flow', () => {
  describe('constructor', () => {
    it('accepts a data tile source, a style, and a max speed', () => {
      const layer = new FlowLayer({
        maxSpeed: 42,
        style: {
          color: 'red',
        },
        source: new DataTileSource({
          loader(z, x, y) {
            return new Float32Array(256 * 256 * 3);
          },
        }),
      });
      assert.instanceOf(layer, FlowLayer);
    });

    it('throws if maxSpeed is missing', () => {
      assert.throws(() => {
        new FlowLayer({
          style: {
            color: 'red',
          },
          source: new DataTileSource({
            loader(z, x, y) {
              return new Float32Array(256 * 256 * 3);
            },
          }),
        });
      }, 'maxSpeed is required');
    });
  });

  describe('getRenderer()', () => {
    it('creates the renderer', () => {
      const layer = new FlowLayer({
        maxSpeed: 42,
        style: {
          color: 'red',
        },
        source: new DataTileSource({
          loader(z, x, y) {
            return new Float32Array(256 * 256 * 3);
          },
        }),
      });

      const renderer = layer.getRenderer();
      assert.instanceOf(renderer, FlowLayerRenderer);
    });
  });

  describe('the particle color fragment shader', () => {
    it('includes the color', () => {
      const layer = new FlowLayer({
        maxSpeed: 42,
        style: {
          color: 'fuchsia',
        },
        source: new DataTileSource({
          loader(z, x, y) {
            return new Float32Array(256 * 256 * 3);
          },
        }),
      });

      const renderer = layer.getRenderer();
      assert.include(
        renderer.particleColorFragmentShader_,
        'color = vec4(1.0, 0.0, 1.0, 1.0);',
      );
    });
  });
});
