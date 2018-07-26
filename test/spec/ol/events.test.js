import {listen, listenOnce, bindListener, unlisten, unlistenAll, unlistenByKey, findListener, getListeners} from '../../../src/ol/events.js';
import EventTarget from '../../../src/ol/events/Target.js';

describe('ol.events', function() {
  let add, remove, target;

  beforeEach(function() {
    add = sinon.spy();
    remove = sinon.spy();
    target = {
      addEventListener: add,
      removeEventListener: remove
    };
  });

  describe('bindListener()', function() {
    it('binds a listener and returns a bound listener function', function() {
      const listenerObj = {
        listener: sinon.spy(),
        bindTo: {id: 1}
      };
      const boundListener = bindListener(listenerObj);
      expect(listenerObj.boundListener).to.equal(boundListener);
      boundListener();
      expect(listenerObj.listener.thisValues[0]).to.equal(listenerObj.bindTo);
    });
    it('binds to the target when bindTo is not provided', function() {
      const listenerObj = {
        listener: sinon.spy(),
        target: {id: 1}
      };
      const boundListener = bindListener(listenerObj);
      expect(listenerObj.boundListener).to.equal(boundListener);
      boundListener();
      expect(listenerObj.listener.thisValues[0]).to.equal(listenerObj.target);
    });
    it('binds a self-unregistering listener when callOnce is true', function() {
      const bindTo = {id: 1};
      const listenerObj = {
        type: 'foo',
        target: target,
        bindTo: bindTo,
        callOnce: true
      };
      listenerObj.listener = function() {
        expect(this).to.equal(bindTo);
      };
      const boundListener = bindListener(listenerObj);
      expect(listenerObj.boundListener).to.equal(boundListener);
      boundListener();
    });
  });

  describe('findListener()', function() {
    let listener, listenerObj, listeners;

    beforeEach(function() {
      listener = function() {};
      listenerObj = {
        type: 'foo',
        target: target,
        listener: listener
      };
      listeners = [listenerObj];
    });

    it('searches a listener array for a specific listener', function() {
      const bindTo = {id: 1};
      let result = findListener(listeners, listener);
      expect(result).to.be(listenerObj);
      result = findListener(listeners, listener, bindTo);
      expect(result).to.be(undefined);
      listenerObj.bindTo = bindTo;
      result = findListener(listeners, listener);
      expect(result).to.be(undefined);
      result = findListener(listeners, listener, bindTo);
      expect(result).to.be(listenerObj);
    });
    it('marks the delete index on a listener object', function() {
      const result = findListener(listeners, listener, undefined, true);
      expect(result).to.be(listenerObj);
      expect(listenerObj.deleteIndex).to.be(0);
    });
  });

  describe('getListeners()', function() {
    it('returns listeners for a target and type', function() {
      const foo = listen(target, 'foo', function() {});
      const bar = listen(target, 'bar', function() {});
      expect (getListeners(target, 'foo')).to.eql([foo]);
      expect (getListeners(target, 'bar')).to.eql([bar]);
    });
    it('returns undefined when no listeners are registered', function() {
      expect (getListeners(target, 'foo')).to.be(undefined);
    });
  });

  describe('listen()', function() {
    it('calls addEventListener on the target', function() {
      listen(target, 'foo', function() {});
      expect(add.callCount).to.be(1);
    });
    it('returns a key', function() {
      const key = listen(target, 'foo', function() {});
      expect(key).to.be.a(Object);
    });
    it('does not add the same listener twice', function() {
      const listener = function() {};
      const key1 = listen(target, 'foo', listener);
      const key2 = listen(target, 'foo', listener);
      expect(key1).to.equal(key2);
      expect(add.callCount).to.be(1);
    });
    it('only treats listeners as same when all args are equal', function() {
      const listener = function() {};
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, {});
      listen(target, 'foo', listener, undefined);
      expect(add.callCount).to.be(3);
    });
  });

  describe('listenOnce()', function() {
    it('creates a one-off listener', function() {
      const listener = sinon.spy();
      const key = listenOnce(target, 'foo', listener);
      expect(add.callCount).to.be(1);
      expect(key.callOnce).to.be(true);
      key.boundListener();
      expect(listener.callCount).to.be(1);
      expect(remove.callCount).to.be(1);
    });
    it('does not add the same listener twice', function() {
      const listener = function() {};
      const key1 = listenOnce(target, 'foo', listener);
      const key2 = listenOnce(target, 'foo', listener);
      expect(key1).to.equal(key2);
      expect(add.callCount).to.be(1);
      expect(key1.callOnce).to.be(true);
    });
    it('listen() can turn a one-off listener into a permanent one', function() {
      const listener = sinon.spy();
      let key = listenOnce(target, 'foo', listener);
      expect(key.callOnce).to.be(true);
      key = listen(target, 'foo', listener);
      expect(add.callCount).to.be(1);
      expect(key.callOnce).to.be(false);
      key.boundListener();
      expect(remove.callCount).to.be(0);
    });
  });

  describe('unlisten()', function() {
    it('unregisters previously registered listeners', function() {
      const listener = function() {};
      listen(target, 'foo', listener);
      unlisten(target, 'foo', listener);
      expect(getListeners(target, 'foo')).to.be(undefined);
    });
    it('works with multiple types', function() {
      const listener = function() {};
      listen(target, ['foo', 'bar'], listener);
      unlisten(target, ['bar', 'foo'], listener);
      expect(getListeners(target, 'foo')).to.be(undefined);
      expect(getListeners(target, 'bar')).to.be(undefined);
    });
  });

  describe('unlistenByKey()', function() {
    it('unregisters previously registered listeners', function() {
      const key = listen(target, 'foo', function() {});
      unlistenByKey(key);
      expect(getListeners(target, 'foo')).to.be(undefined);
    });
    it('works with multiple types', function() {
      const key = listen(target, ['foo', 'bar'], function() {});
      unlistenByKey(key);
      expect(getListeners(target, 'foo')).to.be(undefined);
      expect(getListeners(target, 'bar')).to.be(undefined);
    });
  });

  describe('unlistenAll()', function() {
    it('unregisters all listeners registered for a target', function() {
      const keys = [
        listen(target, 'foo', function() {}),
        listen(target, 'bar', function() {})
      ];
      unlistenAll(target);
      expect(getListeners(target, 'foo')).to.be(undefined);
      expect(getListeners(target, 'bar')).to.be(undefined);
      expect('ol_lm' in target).to.be(false);
      expect(keys).to.eql([{}, {}]);
    });
  });

  describe('Compatibility with ol.events.EventTarget', function() {
    it('does not register duplicated listeners', function() {
      const target = new EventTarget();
      const listener = function() {};
      const key1 = listen(target, 'foo', listener);
      expect(target.getListeners('foo')).to.eql([key1.boundListener]);
      const key2 = listen(target, 'foo', listener);
      expect(key2.boundListener).to.equal(key1.boundListener);
      expect(target.getListeners('foo')).to.eql([key1.boundListener]);
    });
    it('registers multiple listeners if this object is different', function() {
      const target = new EventTarget();
      const listener = function() {};
      const key1 = listen(target, 'foo', listener, {});
      const key2 = listen(target, 'foo', listener, {});
      expect(key1.boundListener).to.not.equal(key2.boundListener);
      expect(target.getListeners('foo')).to.eql(
        [key1.boundListener, key2.boundListener]);
    });
  });

});
