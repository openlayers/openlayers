import {assert} from 'chai';
import ImageSource from '../../../../../src/ol/source/Image.js';

describe('ol/source/Image', function () {
  describe('constructor', function () {
    it('does not set the static_ flag when no loader is configured', function () {
      const source = new ImageSource({});
      assert.strictEqual(source.static_, false);
    });
    it('does not set the static_ flag when loader accepts arguments', function () {
      const source = new ImageSource({
        loader: function (extent, resolution, projection) {},
      });
      assert.strictEqual(source.static_, false);
    });
    it('sets the static_ flag when loader accepts no arguments', function () {
      const source = new ImageSource({
        loader: function () {},
      });
      assert.strictEqual(source.static_, true);
    });
  });
});
