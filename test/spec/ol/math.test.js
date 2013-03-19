goog.provide('ol.test.math');


describe('ol.math.cosh', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.cosh(-Infinity)).to.eql(Infinity);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.cosh(-1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.cosh(0)).to.eql(1);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.cosh(1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.cosh(Infinity)).to.eql(Infinity);
  });

});


describe('ol.math.coth', function() {

  it('returns the correct value at -1', function() {
    expect(ol.math.coth(-1)).to.roughlyEqual(-1.3130352854993312, 1e-9);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.coth(1)).to.roughlyEqual(1.3130352854993312, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.coth(Infinity)).to.eql(1);
  });

});


describe('ol.math.csch', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.csch(-Infinity)).to.eql(0);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.csch(-1)).to.roughlyEqual(-0.85091812823932156, 1e-9);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.csch(1)).to.roughlyEqual(0.85091812823932156, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.csch(Infinity)).to.eql(0);
  });

});


describe('ol.math.roundUpToPowerOfTwo', function() {

  it('raises an exception when x is negative', function() {
    expect(function() {
      ol.math.roundUpToPowerOfTwo(-1);
    }).to.throwException();
  });

  it('raises an exception when x is zero', function() {
    expect(function() {
      ol.math.roundUpToPowerOfTwo(0);
    }).to.throwException();
  });

  it('returns the expected value for simple powers of two', function() {
    expect(ol.math.roundUpToPowerOfTwo(1)).to.be(1);
    expect(ol.math.roundUpToPowerOfTwo(2)).to.be(2);
    expect(ol.math.roundUpToPowerOfTwo(4)).to.be(4);
    expect(ol.math.roundUpToPowerOfTwo(8)).to.be(8);
    expect(ol.math.roundUpToPowerOfTwo(16)).to.be(16);
    expect(ol.math.roundUpToPowerOfTwo(32)).to.be(32);
    expect(ol.math.roundUpToPowerOfTwo(64)).to.be(64);
    expect(ol.math.roundUpToPowerOfTwo(128)).to.be(128);
    expect(ol.math.roundUpToPowerOfTwo(256)).to.be(256);
  });

  it('returns the expected value for simple powers of ten', function() {
    expect(ol.math.roundUpToPowerOfTwo(1)).to.be(1);
    expect(ol.math.roundUpToPowerOfTwo(10)).to.be(16);
    expect(ol.math.roundUpToPowerOfTwo(100)).to.be(128);
    expect(ol.math.roundUpToPowerOfTwo(1000)).to.be(1024);
    expect(ol.math.roundUpToPowerOfTwo(10000)).to.be(16384);
    expect(ol.math.roundUpToPowerOfTwo(100000)).to.be(131072);
    expect(ol.math.roundUpToPowerOfTwo(1000000)).to.be(1048576);
    expect(ol.math.roundUpToPowerOfTwo(10000000)).to.be(16777216);
  });

});


describe('ol.math.sech', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.sech(-Infinity)).to.eql(0);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.sech(-1)).to.roughlyEqual(0.64805427366388535, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.sech(0)).to.eql(1);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.sech(1)).to.roughlyEqual(0.64805427366388535, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.sech(Infinity)).to.eql(0);
  });

});


describe('ol.math.sinh', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.sinh(-Infinity)).to.eql(-Infinity);
  });

  it('returns the correct value at -1', function() {
    expect(ol.math.sinh(-1)).to.roughlyEqual(-1.1752011936438014, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.sinh(0)).to.eql(0);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.sinh(1)).to.roughlyEqual(1.1752011936438014, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.cosh(Infinity)).to.eql(Infinity);
  });

});


describe('ol.math.tanh', function() {

  it('returns the correct value at -1', function() {
    expect(ol.math.tanh(-1)).to.roughlyEqual(-0.76159415595576485, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(ol.math.tanh(0)).to.eql(0);
  });

  it('returns the correct value at 1', function() {
    expect(ol.math.tanh(1)).to.roughlyEqual(0.76159415595576485, 1e-9);
  });

});


goog.require('ol.math');
