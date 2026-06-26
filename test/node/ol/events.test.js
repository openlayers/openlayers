import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import {listen, listenOnce, unlistenByKey} from '../../../src/ol/events.js';
import EventTarget from '../../../src/ol/events/Target.js';

describe('ol/events.js', function () {
  let add, target;

  beforeEach(function () {
    target = new EventTarget();
    add = sinonSpy(target, 'addEventListener');
  });

  afterEach(function () {
    target.addEventListener.restore();
  });

  describe('listen()', function () {
    it('calls addEventListener on the target', function () {
      listen(target, 'foo', function () {});
      assert.strictEqual(add.callCount, 1);
    });
    it('returns a key', function () {
      const key = listen(target, 'foo', function () {});
      assert.instanceOf(key, Object);
    });
    it('does not add the same listener twice', function () {
      const listener = function () {};
      listen(target, 'foo', listener);
      listen(target, 'foo', listener);
      assert.strictEqual(target.listeners_['foo'].length, 1);
    });
    it('only treats listeners as same when all args are equal', function () {
      const listener = function () {};
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, undefined);
      assert.strictEqual(target.listeners_['foo'].length, 3);
    });
    it('stops propagation when false is returned', () => {
      const listener1 = sinonSpy(() => false);
      const listener2 = sinonSpy();
      const target = new EventTarget();
      listen(target, 'bar', listener1);
      listen(target, 'bar', listener2);
      target.dispatchEvent('bar');
      assert.strictEqual(listener1.calledOnce, true);
      assert.strictEqual(listener2.calledOnce, false);
    });
  });

  describe('listenOnce()', function () {
    it('creates a one-off listener', function () {
      const target = new EventTarget();
      const listener = sinonSpy();
      listenOnce(target, 'foo', listener);
      target.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 1);
      target.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 1);
    });
    it('Adds the same listener twice', function () {
      const listener = sinonSpy();
      listenOnce(target, 'foo', listener);
      listenOnce(target, 'foo', listener);
      target.dispatchEvent('foo');
      target.dispatchEvent('foo');
      target.dispatchEvent('foo');
      assert.strictEqual(listener.callCount, 2);
    });
    it('is called with the provided this argument', () => {
      const listener = sinonSpy();
      const target = new EventTarget();
      const that = {};
      listenOnce(target, 'bar', listener, that);
      target.dispatchEvent('bar');
      assert.strictEqual(listener.thisValues[0], that);
    });
    it('stops propagation when false is returned', () => {
      const listener1 = sinonSpy(() => false);
      const listener2 = sinonSpy();
      const target = new EventTarget();
      listenOnce(target, 'bar', listener1);
      listenOnce(target, 'bar', listener2);
      target.dispatchEvent('bar');
      assert.strictEqual(listener1.calledOnce, true);
      assert.strictEqual(listener2.calledOnce, false);
    });
  });

  describe('unlistenByKey()', function () {
    it('unregisters previously registered listeners', function () {
      const key = listen(target, 'foo', function () {});
      unlistenByKey(key);
      assert.strictEqual(target.listeners_['foo'], undefined);
    });
    it('works with multiple types', function () {
      const key = listen(target, ['foo', 'bar'], function () {});
      unlistenByKey(key);
      assert.strictEqual(target.listeners_['foo'], undefined);
      assert.strictEqual(target.listeners_['bar'], undefined);
    });
  });

  describe('Listener keys', function () {
    it('does not register duplicated listeners', function () {
      const target = new EventTarget();
      const listener = function () {};
      const key1 = listen(target, 'foo', listener);
      assert.deepEqual(target.listeners_['foo'], [listener]);
      const key2 = listen(target, 'foo', listener);
      assert.deepEqual(target.listeners_['foo'], [listener]);
      assert.equal(key1.listener, key2.listener);
    });
    it('registers multiple listeners if this object is different', function () {
      const target = new EventTarget();
      const listener = function () {};
      const key1 = listen(target, 'foo', listener, {});
      const key2 = listen(target, 'foo', listener, {});
      assert.notStrictEqual(key1.listener, key2.listener);
      assert.deepEqual(target.listeners_['foo'], [
        key1.listener,
        key2.listener,
      ]);
    });
  });
});
