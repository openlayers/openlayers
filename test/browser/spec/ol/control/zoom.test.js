import {assert} from 'chai';
import Zoom from '../../../../../src/ol/control/Zoom.js';

describe('ol.control.Zoom', function () {
  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const instance = new Zoom();
      assert.instanceOf(instance, Zoom);
    });
  });
});
