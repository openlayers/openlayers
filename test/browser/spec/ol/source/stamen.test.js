import Stamen from '../../../../../src/ol/source/Stamen.js';

describe('ol.source.Stamen', function () {
  describe('constructor', function () {
    it('can be constructed with a custom minZoom', function () {
      const source = new Stamen({
        layer: 'watercolor',
        minZoom: 10,
      });
      expect(source.getTileGrid().getMinZoom()).to.be(10);
    });

    it('can be constructed with a custom maxZoom', function () {
      const source = new Stamen({
        layer: 'watercolor',
        maxZoom: 8,
      });
      expect(source.getTileGrid().getMaxZoom()).to.be(8);
    });
  });
});
