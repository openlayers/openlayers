import EventTarget from '../../../src/ol/events/Target.js';
import Observable, {unByKey} from '../../../src/ol/Observable.js';


describe('ol.Observable', () => {

  describe('constructor', () => {

    test('creates a new observable', () => {
      const observable = new Observable();
      expect(observable).toBeInstanceOf(Observable);
      expect(observable).toBeInstanceOf(EventTarget);
    });

  });

  describe('#on()', () => {
    let observable, listener;
    beforeEach(() => {
      observable = new Observable();
      listener = sinon.spy();
    });

    test('registers a listener for events of the given type', () => {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).toBe(2);
    });

    test('accepts an array of event types', () => {
      observable.on(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      observable.dispatchEvent('bar');
      expect(listener.callCount).toBe(2);
    });

    test('returns a listener key', () => {
      const key = observable.on('foo', listener);

      expect(typeof key).toBe('object');
    });

  });

  describe('#once()', () => {
    let observable, listener;
    beforeEach(() => {
      observable = new Observable();
      listener = sinon.spy();
    });

    test('registers a listener that is only called once', () => {
      observable.once('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).toBe(1);
    });

    test('is safe to dispatch events of same type in a once listener', () => {
      let callCount = 0;
      observable.once('change', function() {
        observable.changed();
        observable.changed();
      });
      observable.on('change', function() {
        ++callCount;
      });
      expect(function() {
        observable.changed();
      }).not.toThrow();
      expect(callCount).toBe(3);
    });

    test('accepts an array of event types (called once for each)', () => {
      observable.once(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      observable.dispatchEvent('foo');
      expect(listener.callCount).toBe(1);

      observable.dispatchEvent('bar');
      expect(listener.callCount).toBe(2);

      observable.dispatchEvent('bar');
      expect(listener.callCount).toBe(2);
    });

    test('returns a listener key', () => {
      const key = observable.once('foo', listener);

      expect(typeof key).toBe('object');
    });

  });

  describe('#un()', () => {
    let observable, listener;
    beforeEach(() => {
      observable = new Observable();
      listener = sinon.spy();
    });

    test('unregisters a previously registered listener', () => {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);
    });

  });

  describe('ol.Observable.unByKey()', () => {
    let observable, listener;
    beforeEach(() => {
      observable = new Observable();
      listener = sinon.spy();
    });

    test('unregisters a listener given the key returned by `on`', () => {
      const key = observable.on('foo', listener);

      observable.dispatchEvent('foo');
      expect(listener.calledOnce).toBe(true);

      unByKey(key);
      observable.dispatchEvent('foo');
      expect(listener.callCount).toBe(1);
    });

  });

});
