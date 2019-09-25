import Geolocation from '../../../src/ol/Geolocation.js';


describe('ol.Geolocation', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new Geolocation();
      expect(instance).toBeInstanceOf(Geolocation);
    });

  });

});
