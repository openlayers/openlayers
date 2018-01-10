import Stamen from '../../../../src/ol/source/Stamen.js';


describe('ol.source.Stamen', function() {

  describe('constructor', function() {

    it('can be constructed with a custom minZoom', function() {
      var source = new Stamen({
        layer: 'watercolor',
        minZoom: 10
      });
      expect(source.getTileGrid().getMinZoom()).to.be(10);
    });

    it('can be constructed with a custom maxZoom', function() {
      var source = new Stamen({
        layer: 'watercolor',
        maxZoom: 8
      });
      expect(source.getTileGrid().getMaxZoom()).to.be(8);

    });

  });

});
