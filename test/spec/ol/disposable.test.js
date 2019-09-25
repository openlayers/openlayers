import Disposable from '../../../src/ol/Disposable.js';


describe('ol.Disposable', () => {

  describe('constructor', () => {

    test('creates an instance', () => {
      const disposable = new Disposable();
      expect(disposable).toBeInstanceOf(Disposable);
    });

  });

  describe('#disposed_', () => {

    test('is initially false', () => {
      const disposable = new Disposable();
      expect(disposable.disposed_).toBe(false);
    });

    test('is true after a call to dispose', () => {
      const disposable = new Disposable();
      disposable.dispose();
      expect(disposable.disposed_).toBe(true);
    });

  });

  describe('#dispose()', () => {

    test('calls disposeInternal only once', () => {
      const disposable = new Disposable();
      sinon.spy(disposable, 'disposeInternal');
      expect(disposable.disposeInternal.called).toBe(false);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).toBe(1);
      disposable.dispose();
      expect(disposable.disposeInternal.callCount).toBe(1);
    });

  });

});
