import BaseObject from '../../../src/ol/Object.js';
import {listen} from '../../../src/ol/events.js';


describe('ol.Object', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  let o;
  beforeEach(() => {
    o = new BaseObject();
  });

  describe('get, set and unset', () => {

    describe('get an unset property', () => {
      let v;
      beforeEach(() => {
        v = o.get('k');
      });

      test('returns undefined', () => {
        expect(v).toBe(undefined);
      });
    });

    describe('get a set property', () => {
      let v;
      beforeEach(() => {
        o.set('k', 1);
        v = o.get('k');
      });

      test('returns expected value', () => {
        expect(v).toEqual(1);
      });
    });

    describe('unset a set property', () => {
      beforeEach(() => {
        o.set('k', 1);
      });

      test('returns undefined', () => {
        const v = o.unset('k');
        expect(v).toBe(undefined);
      });
    });
  });

  describe('#get()', () => {

    test('does not return values that are not explicitly set', () => {
      const o = new BaseObject();
      expect(o.get('constructor')).toBe(undefined);
      expect(o.get('hasOwnProperty')).toBe(undefined);
      expect(o.get('isPrototypeOf')).toBe(undefined);
      expect(o.get('propertyIsEnumerable')).toBe(undefined);
      expect(o.get('toLocaleString')).toBe(undefined);
      expect(o.get('toString')).toBe(undefined);
      expect(o.get('valueOf')).toBe(undefined);
    });

  });

  describe('#set()', () => {
    test('can be used with arbitrary names', () => {
      const o = new BaseObject();

      o.set('set', 'sat');
      expect(o.get('set')).toBe('sat');

      o.set('get', 'got');
      expect(o.get('get')).toBe('got');

      o.set('toString', 'string');
      expect(o.get('toString')).toBe('string');
      expect(typeof o.toString).toBe('function');
    });
  });

  describe('#getKeys()', () => {

    test('returns property names set at construction', () => {
      const o = new BaseObject({
        prop1: 'val1',
        prop2: 'val2',
        toString: 'string',
        get: 'foo'
      });

      const keys = o.getKeys();
      expect(keys.length).toBe(4);
      expect(keys.sort()).toEqual(['get', 'prop1', 'prop2', 'toString']);
    });

  });

  describe('setProperties', () => {

    test('sets multiple values at once', () => {
      o.setProperties({
        k1: 1,
        k2: 2
      });
      expect(o.get('k1')).toEqual(1);
      expect(o.get('k2')).toEqual(2);

      const keys = o.getKeys().sort();
      expect(keys).toEqual(['k1', 'k2']);
    });
  });

  describe('notify', () => {

    let listener1, listener2;

    beforeEach(() => {
      listener1 = sinon.spy();
      listen(o, 'change:k', listener1);

      listener2 = sinon.spy();
      listen(o, 'propertychange', listener2);
    });

    test('dispatches events', () => {
      o.notify('k', 1);
      expect(listener1.calledOnce).toBe(true);
      const args = listener1.firstCall.args;
      expect(args).toHaveLength(1);
      const event = args[0];
      expect(event.key).toBe('k');
      expect(event.oldValue).toBe(1);
    });

    test('dispatches generic change events to bound objects', () => {
      o.notify('k', 1);
      expect(listener2.calledOnce).toBe(true);
      const args = listener2.firstCall.args;
      expect(args).toHaveLength(1);
      const event = args[0];
      expect(event.key).toBe('k');
      expect(event.oldValue).toBe(1);
    });
  });

  describe('set', () => {

    let listener1, listener2;

    beforeEach(() => {
      listener1 = sinon.spy();
      listen(o, 'change:k', listener1);

      listener2 = sinon.spy();
      listen(o, 'propertychange', listener2);
    });

    test('dispatches events to object', () => {
      o.set('k', 1);
      expect(listener1).to.be.called();

      expect(o.getKeys()).toEqual(['k']);
    });

    test('dispatches generic change events to object', () => {
      o.set('k', 1);
      expect(listener2.calledOnce).toBe(true);
      const args = listener2.firstCall.args;
      expect(args).toHaveLength(1);
      const event = args[0];
      expect(event.key).toBe('k');
    });

    test('dispatches events only if the value is different', () => {
      o.set('k', 1);
      o.set('k', 1);
      expect(listener1.calledOnce).toBe(true);
      expect(listener2.calledOnce).toBe(true);
    });

  });

  describe('setter', () => {
    beforeEach(() => {
      o.setX = function(x) {
        testContext.set('x', x);
      };
      sinon.spy(o, 'setX');
    });

    test('does not call the setter', () => {
      o.set('x', 1);
      expect(o.get('x')).toEqual(1);
      expect(o.setX).to.not.be.called();

      expect(o.getKeys()).toEqual(['x']);
    });
  });

  describe('getter', () => {
    beforeEach(() => {
      o.getX = function() {
        return 1;
      };
      sinon.spy(o, 'getX');
    });

    test('does not call the getter', () => {
      expect(o.get('x')).toBe(undefined);
      expect(o.getX).to.not.be.called();
    });
  });

  describe('create with options', () => {
    test('sets the property', () => {
      const o = new BaseObject({k: 1});
      expect(o.get('k')).toEqual(1);

      expect(o.getKeys()).toEqual(['k']);
    });
  });

  describe('case sensitivity', () => {
    let listener1, listener2;

    beforeEach(() => {
      listener1 = sinon.spy();
      listen(o, 'change:k', listener1);
      listener2 = sinon.spy();
      listen(o, 'change:K', listener2);
    });

    test('dispatches the expected event', () => {
      o.set('K', 1);
      expect(listener1).to.not.be.called();
      expect(listener2).to.be.called();

      expect(o.getKeys()).toEqual(['K']);
    });
  });
});
