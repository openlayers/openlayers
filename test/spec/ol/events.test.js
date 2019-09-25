import {listen, listenOnce, unlistenByKey} from '../../../src/ol/events.js';
import EventTarget from '../../../src/ol/events/Target.js';

describe('ol.events', () => {
  let add, target;

  beforeEach(() => {
    target = new EventTarget();
    add = sinon.spy(target, 'addEventListener');
  });

  afterEach(() => {
    target.addEventListener.restore();
  });


  describe('listen()', () => {
    test('calls addEventListener on the target', () => {
      listen(target, 'foo', function() {});
      expect(add.callCount).toBe(1);
    });
    test('returns a key', () => {
      const key = listen(target, 'foo', function() {});
      expect(key).toBeInstanceOf(Object);
    });
    test('does not add the same listener twice', () => {
      const listener = function() {};
      listen(target, 'foo', listener);
      listen(target, 'foo', listener);
      expect(target.listeners_['foo'].length).toBe(1);
    });
    test('only treats listeners as same when all args are equal', () => {
      const listener = function() {};
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, undefined);
      expect(target.listeners_['foo'].length).toBe(3);
    });
  });

  describe('listenOnce()', () => {
    test('creates a one-off listener', () => {
      const target = new EventTarget();
      const listener = sinon.spy();
      listenOnce(target, 'foo', listener);
      target.dispatchEvent('foo');
      expect(listener.callCount).toBe(1);
      target.dispatchEvent('foo');
      expect(listener.callCount).toBe(1);
    });
    test('Adds the same listener twice', () => {
      const listener = sinon.spy();
      listenOnce(target, 'foo', listener);
      listenOnce(target, 'foo', listener);
      target.dispatchEvent('foo');
      target.dispatchEvent('foo');
      target.dispatchEvent('foo');
      expect(listener.callCount).toBe(2);
    });
  });


  describe('unlistenByKey()', () => {
    test('unregisters previously registered listeners', () => {
      const key = listen(target, 'foo', function() {});
      unlistenByKey(key);
      expect(target.listeners_['foo']).toBe(undefined);
    });
    test('works with multiple types', () => {
      const key = listen(target, ['foo', 'bar'], function() {});
      unlistenByKey(key);
      expect(target.listeners_['foo']).toBe(undefined);
      expect(target.listeners_['bar']).toBe(undefined);
    });
  });


  describe('Listener keys', () => {
    test('does not register duplicated listeners', () => {
      const target = new EventTarget();
      const listener = function() {};
      const key1 = listen(target, 'foo', listener);
      expect(target.listeners_['foo']).toEqual([listener]);
      const key2 = listen(target, 'foo', listener);
      expect(target.listeners_['foo']).toEqual([listener]);
      expect(key1.listener).toBe(key2.listener);
    });
    test('registers multiple listeners if this object is different', () => {
      const target = new EventTarget();
      const listener = function() {};
      const key1 = listen(target, 'foo', listener, {});
      const key2 = listen(target, 'foo', listener, {});
      expect(key1.listener).not.toBe(key2.listener);
      expect(target.listeners_['foo']).toEqual([key1.listener, key2.listener]);
    });
  });

});
