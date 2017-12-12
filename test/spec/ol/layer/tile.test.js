import _ol_layer_Tile_ from '../../../../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../../../../src/ol/source/OSM.js';


describe('ol.layer.Tile', function() {

  describe('constructor (defaults)', function() {

    var layer;

    beforeEach(function() {
      layer = new _ol_layer_Tile_({
        source: new _ol_source_OSM_()
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(_ol_layer_Tile_);
    });

    it('provides default preload', function() {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function() {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
    });

  });

});
