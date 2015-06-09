goog.provide('ol.test.math');


describe('ol.math.clamp', function() {

  it('returns the correct value at -Infinity', function() {
    expect(ol.math.clamp(-Infinity, 10, 20)).to.eql(10);
  });

  it('returns the correct value at min', function() {
    expect(ol.math.clamp(10, 10, 20)).to.eql(10);
  });

  it('returns the correct value at mid point', function() {
    expect(ol.math.clamp(15, 10, 20)).to.eql(15);
  });

  it('returns the correct value at max', function() {
    expect(ol.math.clamp(20, 10, 20)).to.eql(20);
  });

  it('returns the correct value at Infinity', function() {
    expect(ol.math.clamp(Infinity, 10, 20)).to.eql(20);
  });

});


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


describe('ol.math.solveLinearSystem', function() {
  it('calculates correctly', function() {
    var result = ol.math.solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [6, 8, 18, 5]
    ]);
    expect(result[0]).to.roughlyEqual(0.3, 1e-9);
    expect(result[1]).to.roughlyEqual(0.4, 1e-9);
    expect(result[2]).to.roughlyEqual(0, 1e-9);
  });
  it('can handle singular matrix', function() {
    var result = ol.math.solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [2, 1, 3, 1]
    ]);
    expect(result).to.be(null);
  });
  it('raises an exception when the matrix is malformed', function() {
    expect(function() {
      ol.math.solveLinearSystem([
        [2, 1, 3, 1],
        [2, 6, 8, 3],
        [6, 8, 18]
      ]);
    }).to.throwException();

    expect(function() {
      ol.math.solveLinearSystem([
        [2, 1, 3, 1],
        [2, 6, 8, 3],
        [6, 8, 18, 5, 0]
      ]);
    }).to.throwException();
  });
});


describe('ol.math.toDegrees', function() {
  it('returns the correct value at -π', function() {
    expect(ol.math.toDegrees(-Math.PI)).to.be(-180);
  });
  it('returns the correct value at 0', function() {
    expect(ol.math.toDegrees(0)).to.be(0);
  });
  it('returns the correct value at π', function() {
    expect(ol.math.toDegrees(Math.PI)).to.be(180);
  });
});


describe('ol.math.toRadians', function() {
  it('returns the correct value at -180', function() {
    expect(ol.math.toRadians(-180)).to.be(-Math.PI);
  });
  it('returns the correct value at 0', function() {
    expect(ol.math.toRadians(0)).to.be(0);
  });
  it('returns the correct value at 180', function() {
    expect(ol.math.toRadians(180)).to.be(Math.PI);
  });
});



goog.require('ol.math');
