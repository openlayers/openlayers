import {assign, clear, isEmpty, getValues} from '../../../src/ol/obj.js';


describe('ol.obj.assign()', () => {

  test('is an alias for Object.assign() where available', () => {
    if (typeof Object.assign === 'function') {
      expect(assign).toBe(Object.assign);
    }
  });

  test('assigns properties from a source object to a target object', () => {

    const source = {
      sourceProp1: 'sourceValue1',
      sourceProp2: 'sourceValue2'
    };

    const target = {
      sourceProp1: 'overridden',
      targetProp1: 'targetValue1'
    };

    const assigned = assign(target, source);
    expect(assigned).toBe(target);
    expect(assigned.sourceProp1).toBe('sourceValue1');
    expect(assigned.sourceProp2).toBe('sourceValue2');
    expect(assigned.targetProp1).toBe('targetValue1');

  });

  test('throws a TypeError with `undefined` as target', () => {
    try {
      assign();
      throw Error('Function did not throw');
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
    }
  });

  test('throws a TypeError with `null` as target', () => {
    try {
      assign();
      throw Error('Function did not throw');
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError);
    }
  });

});

describe('ol.obj.clear()', () => {

  test('removes all properties from an object', () => {
    expect(isEmpty(clear({foo: 'bar'}))).toBe(true);
    expect(isEmpty(clear({foo: 'bar', num: 42}))).toBe(true);
    expect(isEmpty(clear({}))).toBe(true);
    expect(isEmpty(clear(null))).toBe(true);
  });

});

describe('ol.obj.getValues()', () => {

  test('gets a list of property values from an object', () => {
    expect(getValues({foo: 'bar', num: 42}).sort()).toEqual([42, 'bar']);
    expect(getValues([])).toEqual([]);
  });

});

describe('ol.obj.isEmpty()', () => {

  test('checks if an object has any properties', () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty({foo: 'bar'})).toBe(false);
    expect(isEmpty({foo: false})).toBe(false);
  });

});
