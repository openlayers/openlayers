import expect from '../expect.js';
import {memoizeOne, toPromise} from '../../../src/ol/functions.js';

describe('ol/functions.js', function () {
  describe('toPromise()', () => {
    it('returns a promise given a getter for a value', (done) => {
      const getter = () => 'a value';
      const promise = toPromise(getter);
      expect(promise).to.be.a(Promise);
      promise.then((value) => {
        expect(value).to.be('a value');
        done();
      }, done);
    });

    it('returns a promise given a getter for a promise that resolves', (done) => {
      const getter = () => Promise.resolve('a value');
      const promise = toPromise(getter);
      expect(promise).to.be.a(Promise);
      promise.then((value) => {
        expect(value).to.be('a value');
        done();
      }, done);
    });

    it('returns a promise that rejects given a getter that throws', (done) => {
      const getter = () => {
        throw new Error('an error');
      };
      const promise = toPromise(getter);
      expect(promise).to.be.a(Promise);
      promise.then(
        (value) => {
          done(new Error(`expected promise to reject, got ${value}`));
        },
        (err) => {
          expect(err).to.be.an(Error);
          expect(err.message).to.be('an error');
          done();
        }
      );
    });

    it('returns a promise that rejects given a getter for a promse that rejects', (done) => {
      const getter = () => Promise.reject(new Error('an error'));
      const promise = toPromise(getter);
      expect(promise).to.be.a(Promise);
      promise.then(
        (value) => {
          done(new Error(`expected promise to reject, got ${value}`));
        },
        (err) => {
          expect(err).to.be.an(Error);
          expect(err.message).to.be('an error');
          done();
        }
      );
    });
  });

  describe('memoizeOne()', function () {
    it('returns the result from the first call when called a second time with the same args', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      expect(memoized(arg1, arg2, arg3)).to.be(result);
    });

    it('returns the result from the first call when called a second time with the same this object', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);

      const thisObj = {};

      const result = memoized.call(thisObj, arg1, arg2, arg3);
      expect(memoized.call(thisObj, arg1, arg2, arg3)).to.be(result);
    });

    it('returns a different result when called a second time with the different args', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const memoized = memoizeOne(call);
      const result = memoized(arg1, arg2, arg3);
      expect(memoized(arg3, arg2, arg1)).not.to.be(result);
    });

    it('returns a different result when called a second time with a different this object', function () {
      const arg1 = {};
      const arg2 = {};
      const arg3 = {};
      function call(a1, a2, a3) {
        return {};
      }
      const firstThis = {};
      const secondThis = {};
      const memoized = memoizeOne(call);
      const result = memoized.call(firstThis, arg1, arg2, arg3);
      expect(memoized.call(secondThis, arg1, arg2, arg3)).not.to.be(result);
    });
  });
});
