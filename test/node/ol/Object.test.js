import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import BaseObject from '../../../src/ol/Object.js';
import {listen} from '../../../src/ol/events.js';

describe('ol/Object.js', function () {
  let o;
  beforeEach(function () {
    o = new BaseObject();
  });

  describe('get, set and unset', function () {
    describe('get an unset property', function () {
      let v;
      beforeEach(function () {
        v = o.get('k');
      });

      it('returns undefined', function () {
        assert.strictEqual(v, undefined);
      });
    });

    describe('get a set property', function () {
      let v;
      beforeEach(function () {
        o.set('k', 1);
        v = o.get('k');
      });

      it('returns expected value', function () {
        assert.deepEqual(v, 1);
      });
    });

    describe('unset a set property', function () {
      beforeEach(function () {
        o.set('k', 1);
      });

      it('returns undefined', function () {
        const v = o.unset('k');
        assert.strictEqual(v, undefined);
      });
    });
  });

  describe('#get()', function () {
    it('does not return values that are not explicitly set', function () {
      const o = new BaseObject();
      assert.strictEqual(o.get('constructor'), undefined);
      assert.strictEqual(o.get('hasOwnProperty'), undefined);
      assert.strictEqual(o.get('isPrototypeOf'), undefined);
      assert.strictEqual(o.get('propertyIsEnumerable'), undefined);
      assert.strictEqual(o.get('toLocaleString'), undefined);
      assert.strictEqual(o.get('toString'), undefined);
      assert.strictEqual(o.get('valueOf'), undefined);
    });
  });

  describe('#set()', function () {
    it('can be used with arbitrary names', function () {
      const o = new BaseObject();

      o.set('set', 'sat');
      assert.strictEqual(o.get('set'), 'sat');

      o.set('get', 'got');
      assert.strictEqual(o.get('get'), 'got');

      o.set('toString', 'string');
      assert.strictEqual(o.get('toString'), 'string');
      assert.strictEqual(typeof o.toString, 'function');
    });
  });

  describe('#getKeys()', function () {
    it('returns property names set at construction', function () {
      const o = new BaseObject({
        prop1: 'val1',
        prop2: 'val2',
        toString: 'string',
        get: 'foo',
      });

      const keys = o.getKeys();
      assert.strictEqual(keys.length, 4);
      assert.deepEqual(keys.sort(), ['get', 'prop1', 'prop2', 'toString']);
    });
  });

  describe('setProperties', function () {
    it('sets multiple values at once', function () {
      o.setProperties({
        k1: 1,
        k2: 2,
      });
      assert.deepEqual(o.get('k1'), 1);
      assert.deepEqual(o.get('k2'), 2);

      const keys = o.getKeys().sort();
      assert.deepEqual(keys, ['k1', 'k2']);
    });
  });

  describe('hasProperties', function () {
    it('has no properties after creation', function () {
      assert.deepEqual(o.hasProperties(), false);
    });

    it('has properties after set', function () {
      o.set('foo', 1);
      assert.deepEqual(o.hasProperties(), true);
    });

    it('has no properties after unset all', function () {
      o.unset('foo');
      assert.deepEqual(o.hasProperties(), false);
    });
  });

  describe('notify', function () {
    let listener1, listener2;

    beforeEach(function () {
      listener1 = sinonSpy();
      listen(o, 'change:k', listener1);

      listener2 = sinonSpy();
      listen(o, 'propertychange', listener2);
    });

    it('dispatches events', function () {
      o.notify('k', 1);
      assert.strictEqual(listener1.calledOnce, true);
      const args = listener1.firstCall.args;
      assert.lengthOf(args, 1);
      const event = args[0];
      assert.strictEqual(event.key, 'k');
      assert.strictEqual(event.oldValue, 1);
    });

    it('dispatches generic change events to bound objects', function () {
      o.notify('k', 1);
      assert.strictEqual(listener2.calledOnce, true);
      const args = listener2.firstCall.args;
      assert.lengthOf(args, 1);
      const event = args[0];
      assert.strictEqual(event.key, 'k');
      assert.strictEqual(event.oldValue, 1);
    });
  });

  describe('set', function () {
    let listener1, listener2;

    beforeEach(function () {
      listener1 = sinonSpy();
      listen(o, 'change:k', listener1);

      listener2 = sinonSpy();
      listen(o, 'propertychange', listener2);
    });

    it('dispatches events to object', function () {
      o.set('k', 1);
      assert.strictEqual(listener1.called, true);

      assert.deepEqual(o.getKeys(), ['k']);
    });

    it('dispatches generic change events to object', function () {
      o.set('k', 1);
      assert.strictEqual(listener2.calledOnce, true);
      const args = listener2.firstCall.args;
      assert.lengthOf(args, 1);
      const event = args[0];
      assert.strictEqual(event.key, 'k');
    });

    it('dispatches events only if the value is different', function () {
      o.set('k', 1);
      o.set('k', 1);
      assert.strictEqual(listener1.calledOnce, true);
      assert.strictEqual(listener2.calledOnce, true);
    });
  });

  describe('setter', function () {
    beforeEach(function () {
      o.setX = function (x) {
        this.set('x', x);
      };
      sinonSpy(o, 'setX');
    });

    it('does not call the setter', function () {
      o.set('x', 1);
      assert.deepEqual(o.get('x'), 1);
      assert.strictEqual(o.setX.called, false);

      assert.deepEqual(o.getKeys(), ['x']);
    });
  });

  describe('getter', function () {
    beforeEach(function () {
      o.getX = function () {
        return 1;
      };
      sinonSpy(o, 'getX');
    });

    it('does not call the getter', function () {
      assert.strictEqual(o.get('x'), undefined);
      assert.strictEqual(o.getX.called, false);
    });
  });

  describe('create with options', function () {
    it('sets the property', function () {
      const o = new BaseObject({k: 1});
      assert.deepEqual(o.get('k'), 1);

      assert.deepEqual(o.getKeys(), ['k']);
    });
  });

  describe('case sensitivity', function () {
    let listener1, listener2;

    beforeEach(function () {
      listener1 = sinonSpy();
      listen(o, 'change:k', listener1);
      listener2 = sinonSpy();
      listen(o, 'change:K', listener2);
    });

    it('dispatches the expected event', function () {
      o.set('K', 1);
      assert.strictEqual(listener1.called, false);
      assert.strictEqual(listener2.called, true);

      assert.deepEqual(o.getKeys(), ['K']);
    });
  });
});
