goog.provide('ol.test.math');


describe('ol.math.cosh', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.cosh(-Infinity)).toEqual(Infinity);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.cosh(-1)).toRoughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.cosh(0)).toEqual(1);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.cosh(1)).toRoughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.cosh(Infinity)).toEqual(Infinity);
  });

});


describe('ol.math.coth', function() {

  it('returns the correct value at -1', function() {
    expect(ol.math.coth(-1)).toRoughlyEqual(-1.3130352854993312, 1e-9);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.coth(1)).toRoughlyEqual(1.3130352854993312, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.coth(Infinity)).toEqual(1);
  });

});


describe('ol.math.csch', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.csch(-Infinity)).toEqual(0);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.csch(-1)).toRoughlyEqual(-0.85091812823932156, 1e-9);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.csch(1)).toRoughlyEqual(0.85091812823932156, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.csch(Infinity)).toEqual(0);
  });

});


describe('ol.math.sech', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.sech(-Infinity)).toEqual(0);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.sech(-1)).toRoughlyEqual(0.64805427366388535, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.sech(0)).toEqual(1);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.sech(1)).toRoughlyEqual(0.64805427366388535, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.sech(Infinity)).toEqual(0);
  });

});


describe('ol.math.sinh', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.sinh(-Infinity)).toEqual(-Infinity);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.sinh(-1)).toRoughlyEqual(-1.1752011936438014, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.sinh(0)).toEqual(0);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.sinh(1)).toRoughlyEqual(1.1752011936438014, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.cosh(Infinity)).toEqual(Infinity);
  });

});


describe('ol.math.tanh', function() {

  it('returns the correct value at -1', function() {
    expect(ol.math.tanh(-1)).toRoughlyEqual(-0.76159415595576485, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.tanh(0)).toEqual(0);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.tanh(1)).toRoughlyEqual(0.76159415595576485, 1e-9);
  });

});


goog.require('ol.math');
