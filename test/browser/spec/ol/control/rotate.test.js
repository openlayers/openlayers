import Rotate from '../../../../../src/ol/control/Rotate.js';

describe('ol.control.Rotate', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new Rotate();
      expect(instance).to.be.an(Rotate);
    });
  });
});
