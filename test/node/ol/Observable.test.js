import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import Observable, {unByKey} from '../../../src/ol/Observable.js';
import EventTarget from '../../../src/ol/events/Target.js';

describe('ol/Observable.js', function () {
  describe('constructor', function () {
    it('creates a new observable', function () {
      const observable = new Observable();
      assert.instanceOf(observable, Observable);
      assert.instanceOf(observable, EventTarget);
    });
  });

  describe('#on()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinonSpy();
    });

    it('registers a listener for events of the given type', function () {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 2);
    });

    it('accepts an array of event types', function () {
      observable.on(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      observable.dispatchEvent('bar');
      assert.strictEqual(listener.callCount, 2);
    });

    it('returns a listener key', function () {
      const key = observable.on('foo', listener);

      assert.strictEqual(typeof key, 'object');
    });
  });

  describe('#once()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinonSpy();
    });

    it('registers a listener that is only called once', function () {
      observable.once('foo', listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 1);
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
      assert.doesNotThrow(function () {
        observable.changed();
      });
      assert.strictEqual(callCount, 3);
    });

    it('accepts an array of event types (called once for each)', function () {
      observable.once(['foo', 'bar'], listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 1);

      observable.dispatchEvent('bar');
      assert.strictEqual(listener.callCount, 2);

      observable.dispatchEvent('bar');
      assert.strictEqual(listener.callCount, 2);
    });

    it('returns a listener key', function () {
      const key = observable.once('foo', listener);

      assert.strictEqual(typeof key, 'object');
    });

    it('can be unregistered with un()', function () {
      observable.once('foo', listener);
      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 0);
    });
  });

  describe('#un()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinonSpy();
    });

    it('unregisters a previously registered listener', function () {
      observable.on('foo', listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      observable.un('foo', listener);
      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);
    });
  });

  describe('ol.Observable.unByKey()', function () {
    let observable, listener;
    beforeEach(function () {
      observable = new Observable();
      listener = sinonSpy();
    });

    it('unregisters a listener given the key returned by `on`', function () {
      const key = observable.on('foo', listener);

      observable.dispatchEvent('foo');
      assert.strictEqual(listener.calledOnce, true);

      unByKey(key);
      observable.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 1);
    });
  });
});
