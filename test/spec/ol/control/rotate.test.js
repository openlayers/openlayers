import Rotate from '../../../../src/ol/control/Rotate.js';

describe('ol.control.Rotate', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new Rotate();
      expect(instance).toBeInstanceOf(Rotate);
    });

  });

});
