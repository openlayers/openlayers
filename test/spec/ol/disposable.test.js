

import _ol_Disposable_ from '../../../src/ol/disposable';


describe('ol.Disposable', function() {

  describe('constructor', function() {

    it('creates an instance', function() {
      var disposable = new _ol_Disposable_();
      expect(disposable).to.be.a(_ol_Disposable_);
    });

  });

  describe('#disposed_', function() {

    it('is initially false', function() {
      var disposable = new _ol_Disposable_();
      expect(disposable.disposed_).to.be(false);
    });

    it('is true after a call to dispose', function() {
      var disposable = new _ol_Disposable_();
      disposable.dispose();
      expect(disposable.disposed_).to.be(true);
    });

  });

  describe('#dispose()', function() {

    it('calls disposeInternal only once', function() {
      var disposable = new _ol_Disposable_();
      sinon.spy(disposable, 'disposeInternal');
      expect(disposable.disposeInternal.called).to.be(false);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).to.be(1);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).to.be(1);
    });

  });

});
