import StadiaMaps from '../../../../../src/ol/source/StadiaMaps.js';

describe('ol.source.StadiaMaps', function () {
  describe('constructor', function () {
    it('can be constructed with a custom minZoom', function () {
      const source = new StadiaMaps({
        layer: 'stamen_watercolor',
        minZoom: 10,
      });
      expect(source.getTileGrid().getMinZoom()).to.be(10);
    });

    it('can be constructed with a custom maxZoom', function () {
      const source = new StadiaMaps({
        layer: 'stamen_watercolor',
        maxZoom: 8,
      });
      expect(source.getTileGrid().getMaxZoom()).to.be(8);
    });
  });
});
