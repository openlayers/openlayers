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
      expect(layer).to.be.a(FlowLayer);
    });

    it('throws if maxSpeed is missing', () => {
      expect(() => {
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
      }).to.throwError((e) => expect(e.message).to.eql('maxSpeed is required'));
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
      expect(renderer).to.be.a(FlowLayerRenderer);
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
      expect(renderer.particleColorFragmentShader_).to.contain(
        'color = vec4(1.0, 0.0, 1.0, 1.0);',
      );
    });
  });
});
