import Geolocation from '../../../../src/ol/Geolocation.js';

describe('ol.Geolocation', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new Geolocation();
      expect(instance).to.be.an(Geolocation);
    });
  });
});
