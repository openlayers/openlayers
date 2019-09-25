import ZoomToExtent from '../../../../src/ol/control/ZoomToExtent.js';

describe('ol.control.ZoomToExtent', () => {

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const instance = new ZoomToExtent();
      expect(instance).toBeInstanceOf(ZoomToExtent);
    });

  });

});
