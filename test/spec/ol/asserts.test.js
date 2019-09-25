import {assert} from '../../../src/ol/asserts.js';


describe('ol.asserts', () => {

  describe('ol.asserts.assert', () => {
    test('throws an exception', () => {
      expect(function() {
        assert(false, 42);
      }).toThrow();
    });
  });

});
