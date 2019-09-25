import Stamen from '../../../../src/ol/source/Stamen.js';


describe('ol.source.Stamen', () => {

  describe('constructor', () => {

    test('can be constructed with a custom minZoom', () => {
      const source = new Stamen({
        layer: 'watercolor',
        minZoom: 10
      });
      expect(source.getTileGrid().getMinZoom()).toBe(10);
    });

    test('can be constructed with a custom maxZoom', () => {
      const source = new Stamen({
        layer: 'watercolor',
        maxZoom: 8
      });
      expect(source.getTileGrid().getMaxZoom()).toBe(8);

    });

  });

});
