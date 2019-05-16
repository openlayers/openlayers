import {clamp, lerp, cosh, solveLinearSystem, toDegrees, toRadians, modulo} from '../../../src/ol/math.js';


describe('ol.math.clamp', function() {

  it('returns the correct value at -Infinity', function() {
    expect(clamp(-Infinity, 10, 20)).to.eql(10);
  });

  it('returns the correct value at min', function() {
    expect(clamp(10, 10, 20)).to.eql(10);
  });

  it('returns the correct value at mid point', function() {
    expect(clamp(15, 10, 20)).to.eql(15);
  });

  it('returns the correct value at max', function() {
    expect(clamp(20, 10, 20)).to.eql(20);
  });

  it('returns the correct value at Infinity', function() {
    expect(clamp(Infinity, 10, 20)).to.eql(20);
  });

});

describe('ol.math.cosh', function() {

  it('returns the correct value at -Infinity', function() {
    expect(cosh(-Infinity)).to.eql(Infinity);
  });

  it('returns the correct value at -1', function() {
    expect(cosh(-1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at 0', function() {
    expect(cosh(0)).to.eql(1);
  });

  it('returns the correct value at 1', function() {
    expect(cosh(1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  it('returns the correct value at Infinity', function() {
    expect(cosh(Infinity)).to.eql(Infinity);
  });

});

describe('ol.math.solveLinearSystem', function() {

  it('calculates correctly', function() {
    const result = solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [6, 8, 18, 5]
    ]);
    expect(result[0]).to.roughlyEqual(0.3, 1e-9);
    expect(result[1]).to.roughlyEqual(0.4, 1e-9);
    expect(result[2]).to.roughlyEqual(0, 1e-9);
  });

  it('can handle singular matrix', function() {
    const result = solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [2, 1, 3, 1]
    ]);
    expect(result).to.be(null);
  });

});

describe('ol.math.toDegrees', function() {
  it('returns the correct value at -π', function() {
    expect(toDegrees(-Math.PI)).to.be(-180);
  });
  it('returns the correct value at 0', function() {
    expect(toDegrees(0)).to.be(0);
  });
  it('returns the correct value at π', function() {
    expect(toDegrees(Math.PI)).to.be(180);
  });
});

describe('ol.math.toRadians', function() {
  it('returns the correct value at -180', function() {
    expect(toRadians(-180)).to.be(-Math.PI);
  });
  it('returns the correct value at 0', function() {
    expect(toRadians(0)).to.be(0);
  });
  it('returns the correct value at 180', function() {
    expect(toRadians(180)).to.be(Math.PI);
  });
});

describe('ol.math.modulo', function() {
  it('256 / 8 returns 0', function() {
    expect(modulo(256, 8)).to.be(0);
  });
  it('positive and positive returns a positive ', function() {
    expect(modulo(7, 8)).to.be(7);
  });
  it('same Dividend and Divisor returns 0', function() {
    expect(modulo(4, 4)).to.be(0);
  });
  it('negative and positive returns positive', function() {
    expect(modulo(-3, 4)).to.be(1);
  });
  it('negative and negative returns negative', function() {
    expect(modulo(-4, -5)).to.be(-4);
    expect(modulo(-3, -4)).to.be(-3);
  });
  it('positive and negative returns negative', function() {
    expect(modulo(3, -4)).to.be(-1);
    expect(modulo(1, -5)).to.be(-4);
    expect(modulo(6, -5)).to.be(-4);
  });
});

describe('ol.math.lerp', function() {
  it('correctly interpolated numbers', function() {
    expect(lerp(0, 0, 0)).to.be(0);
    expect(lerp(0, 1, 0)).to.be(0);
    expect(lerp(1, 11, 5)).to.be(51);
  });
  it('correctly interpolates floats', function() {
    expect(lerp(0, 1, 0.5)).to.be(0.5);
    expect(lerp(0.25, 0.75, 0.5)).to.be(0.5);
  });
});
