import {assert} from 'chai';
import Rotate from '../../../../../src/ol/control/Rotate.js';

describe('ol.control.Rotate', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new Rotate();
      assert.instanceOf(instance, Rotate);
    });
  });
});
