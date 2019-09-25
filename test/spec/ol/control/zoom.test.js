import Zoom from '../../../../src/ol/control/Zoom.js';

describe('ol.control.Zoom', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new Zoom();
      expect(instance).toBeInstanceOf(Zoom);
    });

  });

});
