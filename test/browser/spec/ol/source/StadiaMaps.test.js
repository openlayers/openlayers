import {assert} from 'chai';
import StadiaMaps from '../../../../../src/ol/source/StadiaMaps.js';

describe('ol.source.StadiaMaps', function () {
  describe('constructor', function () {
    it('can be constructed with a custom minZoom', function () {
      const source = new StadiaMaps({
        layer: 'stamen_watercolor',
        minZoom: 10,
      });
      assert.strictEqual(source.getTileGrid().getMinZoom(), 10);
    });

    it('can be constructed with a custom maxZoom', function () {
      const source = new StadiaMaps({
        layer: 'stamen_watercolor',
        maxZoom: 8,
      });
      assert.strictEqual(source.getTileGrid().getMaxZoom(), 8);
    });

    it('uses the correct identifier for the outdoors style', function () {
      const source = new StadiaMaps({
        layer: 'outdoors',
      });
      assert.include(source.getUrls()[0], '/outdoors/');
    });
  });
});
