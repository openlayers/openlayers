

import _ol_layer_VectorTile_ from '../../../../src/ol/layer/vectortile';
import _ol_source_VectorTile_ from '../../../../src/ol/source/vectortile';


describe('ol.layer.VectorTile', function() {

  describe('constructor (defaults)', function() {

    var layer;

    beforeEach(function() {
      layer = new _ol_layer_VectorTile_({
        source: new _ol_source_VectorTile_({})
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(_ol_layer_VectorTile_);
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
      var layer = new _ol_layer_VectorTile_({
        renderMode: 'vector',
        source: new _ol_source_VectorTile_({})
      });
      expect(layer.getRenderMode()).to.be('vector');
      layer = new _ol_layer_VectorTile_({
        renderMode: 'image',
        source: new _ol_source_VectorTile_({})
      });
      expect(layer.getRenderMode()).to.be('image');
      expect(function() {
        layer = new _ol_layer_VectorTile_({
          renderMode: 'foo',
          source: new _ol_source_VectorTile_({})
        });
      }).to.throwException();
    });
  });

});
