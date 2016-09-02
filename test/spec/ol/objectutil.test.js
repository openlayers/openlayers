goog.provide('ol.test.object');

goog.require('ol.obj');


describe('ol.obj.assign()', function() {

  it('is an alias for Object.assign() where available', function() {
    if (typeof Object.assign === 'function') {
      expect(ol.obj.assign).to.be(Object.assign);
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

    var assigned = ol.obj.assign(target, source);
    expect(assigned).to.be(target);
    expect(assigned.sourceProp1).to.be('sourceValue1');
    expect(assigned.sourceProp2).to.be('sourceValue2');
    expect(assigned.targetProp1).to.be('targetValue1');

  });

});

describe('ol.obj.clear()', function() {

  it('removes all properties from an object', function() {
    var clear = ol.obj.clear;
    var isEmpty = ol.obj.isEmpty;
    expect(isEmpty(clear({foo: 'bar'}))).to.be(true);
    expect(isEmpty(clear({foo: 'bar', num: 42}))).to.be(true);
    expect(isEmpty(clear({}))).to.be(true);
    expect(isEmpty(clear(null))).to.be(true);
  });

});

describe('ol.obj.getValues()', function() {

  it('gets a list of property values from an object', function() {
    expect(ol.obj.getValues({foo: 'bar', num: 42}).sort()).to.eql([42, 'bar']);
    expect(ol.obj.getValues(null)).to.eql([]);
  });

});

describe('ol.obj.isEmpty()', function() {

  it('checks if an object has any properties', function() {
    expect(ol.obj.isEmpty({})).to.be(true);
    expect(ol.obj.isEmpty(null)).to.be(true);
    expect(ol.obj.isEmpty({foo: 'bar'})).to.be(false);
    expect(ol.obj.isEmpty({foo: false})).to.be(false);
  });

});
