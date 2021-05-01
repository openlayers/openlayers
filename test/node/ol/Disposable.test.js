import Disposable from '../../../src/ol/Disposable.js';
import expect from '../expect.js';
import sinon from 'sinon';

describe('ol/Disposable.js', function () {
  describe('constructor', function () {
    it('creates an instance', function () {
      const disposable = new Disposable();
      expect(disposable).to.be.a(Disposable);
    });
  });

  describe('#disposed', function () {
    it('is initially false', function () {
      const disposable = new Disposable();
      expect(disposable.disposed).to.be(false);
    });

    it('is true after a call to dispose', function () {
      const disposable = new Disposable();
      disposable.dispose();
      expect(disposable.disposed).to.be(true);
    });
  });

  describe('#dispose()', function () {
    it('calls disposeInternal only once', function () {
      const disposable = new Disposable();
      sinon.spy(disposable, 'disposeInternal');
      expect(disposable.disposeInternal.called).to.be(false);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).to.be(1);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).to.be(1);
    });
  });
});
