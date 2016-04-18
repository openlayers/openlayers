goog.provide('ol.test.layer.VectorTile');

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

  });

});

goog.require('ol.layer.VectorTile');
goog.require('ol.source.VectorTile');
