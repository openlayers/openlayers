import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';


describe('ol.layer.VectorTile', () => {

  describe('constructor (defaults)', () => {

    let layer;

    beforeEach(() => {
      layer = new VectorTileLayer({
        source: new VectorTileSource({})
      });
    });

    afterEach(() => {
      layer.dispose();
    });

    test('creates an instance', () => {
      expect(layer).toBeInstanceOf(VectorTileLayer);
    });

    test('provides default preload', () => {
      expect(layer.getPreload()).toBe(0);
    });

    test('provides default useInterimTilesOnError', () => {
      expect(layer.getUseInterimTilesOnError()).toBe(true);
    });

    test('provides default renderMode', () => {
      expect(layer.getRenderMode()).toBe('hybrid');
    });

  });

  describe('constructor (options)', () => {
    test('works with options', () => {
      let layer = new VectorTileLayer({
        renderMode: 'hybrid',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).toBe('hybrid');
      layer = new VectorTileLayer({
        renderMode: 'image',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).toBe('image');
      expect(function() {
        layer = new VectorTileLayer({
          renderMode: 'foo',
          source: new VectorTileSource({})
        });
      }).toThrow();
    });
  });

});
