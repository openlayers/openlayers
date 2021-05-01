import EventTarget from '../../../src/ol/events/Target.js';
import Observable, {unByKey} from '../../../src/ol/Observable.js';
import expect from '../expect.js';
import sinon from 'sinon';

describe('ol/Observable.js', function () {
  describe('constructor', function () {
    it('creates a new observable', function () {
      const observable = new Observable();
      expect(observable).to.be.a(Observable);
      expect(observable).to.be.a(EventTarget);
    });
  });

  describe('#on()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinon.spy();
    });

    it('registers a listener for events of the given type', function () {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(2);
    });

    it('accepts an array of event types', function () {
      observable.on(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);
    });

    it('returns a listener key', function () {
      const key = observable.on('foo', listener);

      expect(typeof key).to.be('object');
    });
  });

  describe('#once()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinon.spy();
    });

    it('registers a listener that is only called once', function () {
      observable.once('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });

    it('is safe to dispatch events of same type in a once listener', function () {
      let callCount = 0;
      observable.once('change', function () {
        observable.changed();
        observable.changed();
      });
      observable.on('change', function () {
        ++callCount;
      });
      expect(function () {
        observable.changed();
      }).to.not.throwException();
      expect(callCount).to.be(3);
    });

    it('accepts an array of event types (called once for each)', function () {
      observable.once(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);

      observable.dispatchEvent('bar');
      expect(listener.callCount).to.be(2);
    });

    it('returns a listener key', function () {
      const key = observable.once('foo', listener);

      expect(typeof key).to.be('object');
    });

    it('can be unregistered with un()', function () {
      observable.once('foo', listener);
      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(0);
    });
  });

  describe('#un()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinon.spy();
    });

    it('unregisters a previously registered listener', function () {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);
    });
  });

  describe('ol.Observable.unByKey()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinon.spy();
    });

    it('unregisters a listener given the key returned by `on`', function () {
      const key = observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).to.be(true);

      unByKey(key);
      observable.dispatchEvent('foo');
      expect(listener.callCount).to.be(1);
    });
  });
});
