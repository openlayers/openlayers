import {assert} from 'chai';
import Disposable from '../../../src/ol/Disposable.js';

describe('ol/Disposable.js', function () {
  describe('constructor', function () {
    it('creates an instance', function () {
      const disposable = new Disposable();
      assert.instanceOf(disposable, Disposable);
    });
  });

  describe('#disposed', function () {
    it('is initially false', function () {
      const disposable = new Disposable();
      assert.strictEqual(disposable.disposed, false);
    });

    it('is true after a call to dispose', function () {
      const disposable = new Disposable();
      disposable.dispose();
      assert.strictEqual(disposable.disposed, true);
    });
  });

  describe('#dispose()', function () {
    it('calls disposeInternal only once', function () {
      const disposable = new Disposable();
      vi.spyOn(disposable, 'disposeInternal');
      assert.strictEqual(disposable.disposeInternal.mock.calls.length, 0);
      disposable.dispose();
      assert.strictEqual(disposable.disposeInternal.mock.calls.length, 1);
      disposable.dispose();
      assert.strictEqual(disposable.disposeInternal.mock.calls.length, 1);
    });
  });
});
