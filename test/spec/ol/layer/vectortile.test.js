goog.provide('ol.test.layer.VectorTile');

goog.require('ol.layer.VectorTile');
goog.require('ol.source.VectorTile');


describe('ol.layer.VectorTile', function() {

  describe('constructor (defaults)', function() {

    var layer;

    beforeEach(function() {
      layer = new ol.layer.VectorTile({
        source: new ol.source.VectorTile({})
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(ol.layer.VectorTile);
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
      var layer = new ol.layer.VectorTile({
        renderMode: 'vector',
        source: new ol.source.VectorTile({})
      });
      expect(layer.getRenderMode()).to.be('vector');
      layer = new ol.layer.VectorTile({
        renderMode: 'image',
        source: new ol.source.VectorTile({})
      });
      expect(layer.getRenderMode()).to.be('image');
      expect(function() {
        layer = new ol.layer.VectorTile({
          renderMode: 'foo',
          source: new ol.source.VectorTile({})
        });
      }).to.throwException();
    });
  });

});
