import ZoomToExtent from '../../../../../src/ol/control/ZoomToExtent.js';

describe('ol.control.ZoomToExtent', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new ZoomToExtent();
      expect(instance).to.be.an(ZoomToExtent);
    });
  });
});
