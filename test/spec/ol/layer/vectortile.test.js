import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';


describe('ol.layer.VectorTile', function() {

  describe('constructor (defaults)', function() {

    let layer;

    beforeEach(function() {
      layer = new VectorTileLayer({
        source: new VectorTileSource({})
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(VectorTileLayer);
    });

    it('provides default preload', function() {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function() {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
    });

    it('provides default renderMode', function() {
      expect(layer.getRenderMode()).to.be('hybrid');
    });

  });

  describe('constructor (options)', function() {
    it('works with options', function() {
      let layer = new VectorTileLayer({
        renderMode: 'hybrid',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).to.be('hybrid');
      layer = new VectorTileLayer({
        renderMode: 'image',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).to.be('image');
      expect(function() {
        layer = new VectorTileLayer({
          renderMode: 'foo',
          source: new VectorTileSource({})
        });
      }).to.throwException();
    });
  });

});
