import expect from '../expect.js';
import {clear, isEmpty} from '../../../src/ol/obj.js';

describe('ol/obj.js', () => {
  describe('clear()', function () {
    it('removes all properties from an object', function () {
      expect(isEmpty(clear({foo: 'bar'}))).to.be(true);
      expect(isEmpty(clear({foo: 'bar', num: 42}))).to.be(true);
      expect(isEmpty(clear({}))).to.be(true);
      expect(isEmpty(clear(null))).to.be(true);
    });
  });

  describe('isEmpty()', function () {
    it('checks if an object has any properties', function () {
      expect(isEmpty({})).to.be(true);
      expect(isEmpty(null)).to.be(true);
      expect(isEmpty({foo: 'bar'})).to.be(false);
      expect(isEmpty({foo: false})).to.be(false);
    });
  });
});
