import FullScreen from '../../../../src/ol/control/FullScreen.js';

describe('ol.control.FullScreen', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new FullScreen();
      expect(instance).toBeInstanceOf(FullScreen);
    });

  });

});
