goog.provide('ol.test.object');

describe('ol.object.assign()', function() {

  it('is an alias for Object.assign() where available', function() {
    if (typeof Object.assign === 'function') {
      expect(ol.object.assign).to.be(Object.assign);
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

    var assigned = ol.object.assign(target, source);
    expect(assigned).to.be(target);
    expect(assigned.sourceProp1).to.be('sourceValue1');
    expect(assigned.sourceProp2).to.be('sourceValue2');
    expect(assigned.targetProp1).to.be('targetValue1');

  });

});

describe('ol.object.clear()', function() {

  it('removes all properties from an object', function() {
    var clear = ol.object.clear;
    var isEmpty = ol.object.isEmpty;
    expect(isEmpty(clear({foo: 'bar'}))).to.be(true);
    expect(isEmpty(clear({foo: 'bar', num: 42}))).to.be(true);
    expect(isEmpty(clear({}))).to.be(true);
    expect(isEmpty(clear(null))).to.be(true);
  });

});

describe('ol.object.getValues()', function() {

  it('gets a list of property values from an object', function() {
    expect(ol.object.getValues({foo: 'bar', num: 42}).sort()).to.eql([42, 'bar']);
    expect(ol.object.getValues(null)).to.eql([]);
  });

});

describe('ol.object.isEmpty()', function() {

  it('checks if an object has any properties', function() {
    expect(ol.object.isEmpty({})).to.be(true);
    expect(ol.object.isEmpty(null)).to.be(true);
    expect(ol.object.isEmpty({foo: 'bar'})).to.be(false);
    expect(ol.object.isEmpty({foo: false})).to.be(false);
  });

});

goog.require('ol.object');
