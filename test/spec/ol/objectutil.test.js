

import _ol_obj_ from '../../../src/ol/obj';


describe('ol.obj.assign()', function() {

  it('is an alias for Object.assign() where available', function() {
    if (typeof Object.assign === 'function') {
      expect(_ol_obj_.assign).to.be(Object.assign);
    }
  });

  it('assigns properties from a source object to a target object', function() {

    var source = {
      sourceProp1: 'sourceValue1',
      sourceProp2: 'sourceValue2'
    };

    var target = {
      sourceProp1: 'overridden',
      targetProp1: 'targetValue1'
    };

    var assigned = _ol_obj_.assign(target, source);
    expect(assigned).to.be(target);
    expect(assigned.sourceProp1).to.be('sourceValue1');
    expect(assigned.sourceProp2).to.be('sourceValue2');
    expect(assigned.targetProp1).to.be('targetValue1');

  });

  it('throws a TypeError with `undefined` as target', function() {
    expect(_ol_obj_.assign).withArgs(undefined).to.throwException(function(e) {
      expect(e).to.be.a(TypeError);
    });
  });

  it('throws a TypeError with `null` as target', function() {
    expect(_ol_obj_.assign).withArgs(null).to.throwException(function(e) {
      expect(e).to.be.a(TypeError);
    });
  });

});

describe('ol.obj.clear()', function() {

  it('removes all properties from an object', function() {
    var clear = _ol_obj_.clear;
    var isEmpty = _ol_obj_.isEmpty;
    expect(isEmpty(clear({foo: 'bar'}))).to.be(true);
    expect(isEmpty(clear({foo: 'bar', num: 42}))).to.be(true);
    expect(isEmpty(clear({}))).to.be(true);
    expect(isEmpty(clear(null))).to.be(true);
  });

});

describe('ol.obj.getValues()', function() {

  it('gets a list of property values from an object', function() {
    expect(_ol_obj_.getValues({foo: 'bar', num: 42}).sort()).to.eql([42, 'bar']);
    expect(_ol_obj_.getValues(null)).to.eql([]);
  });

});

describe('ol.obj.isEmpty()', function() {

  it('checks if an object has any properties', function() {
    expect(_ol_obj_.isEmpty({})).to.be(true);
    expect(_ol_obj_.isEmpty(null)).to.be(true);
    expect(_ol_obj_.isEmpty({foo: 'bar'})).to.be(false);
    expect(_ol_obj_.isEmpty({foo: false})).to.be(false);
  });

});
