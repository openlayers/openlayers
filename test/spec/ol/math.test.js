import {clamp, lerp, cosh, solveLinearSystem, toDegrees, toRadians, modulo} from '../../../src/ol/math.js';


describe('ol.math.clamp', () => {

  test('returns the correct value at -Infinity', () => {
    expect(clamp(-Infinity, 10, 20)).toEqual(10);
  });

  test('returns the correct value at min', () => {
    expect(clamp(10, 10, 20)).toEqual(10);
  });

  test('returns the correct value at mid point', () => {
    expect(clamp(15, 10, 20)).toEqual(15);
  });

  test('returns the correct value at max', () => {
    expect(clamp(20, 10, 20)).toEqual(20);
  });

  test('returns the correct value at Infinity', () => {
    expect(clamp(Infinity, 10, 20)).toEqual(20);
  });

});

describe('ol.math.cosh', () => {

  test('returns the correct value at -Infinity', () => {
    expect(cosh(-Infinity)).toEqual(Infinity);
  });

  test('returns the correct value at -1', () => {
    expect(cosh(-1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  test('returns the correct value at 0', () => {
    expect(cosh(0)).toEqual(1);
  });

  test('returns the correct value at 1', () => {
    expect(cosh(1)).to.roughlyEqual(1.5430806348152437, 1e-9);
  });

  test('returns the correct value at Infinity', () => {
    expect(cosh(Infinity)).toEqual(Infinity);
  });

});

describe('ol.math.solveLinearSystem', () => {

  test('calculates correctly', () => {
    const result = solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [6, 8, 18, 5]
    ]);
    expect(result[0]).to.roughlyEqual(0.3, 1e-9);
    expect(result[1]).to.roughlyEqual(0.4, 1e-9);
    expect(result[2]).to.roughlyEqual(0, 1e-9);
  });

  test('can handle singular matrix', () => {
    const result = solveLinearSystem([
      [2, 1, 3, 1],
      [2, 6, 8, 3],
      [2, 1, 3, 1]
    ]);
    expect(result).toBe(null);
  });

});

describe('ol.math.toDegrees', () => {
  test('returns the correct value at -π', () => {
    expect(toDegrees(-Math.PI)).toBe(-180);
  });
  test('returns the correct value at 0', () => {
    expect(toDegrees(0)).toBe(0);
  });
  test('returns the correct value at π', () => {
    expect(toDegrees(Math.PI)).toBe(180);
  });
});

describe('ol.math.toRadians', () => {
  test('returns the correct value at -180', () => {
    expect(toRadians(-180)).toBe(-Math.PI);
  });
  test('returns the correct value at 0', () => {
    expect(toRadians(0)).toBe(0);
  });
  test('returns the correct value at 180', () => {
    expect(toRadians(180)).toBe(Math.PI);
  });
});

describe('ol.math.modulo', () => {
  test('256 / 8 returns 0', () => {
    expect(modulo(256, 8)).toBe(0);
  });
  test('positive and positive returns a positive ', () => {
    expect(modulo(7, 8)).toBe(7);
  });
  test('same Dividend and Divisor returns 0', () => {
    expect(modulo(4, 4)).toBe(0);
  });
  test('negative and positive returns positive', () => {
    expect(modulo(-3, 4)).toBe(1);
  });
  test('negative and negative returns negative', () => {
    expect(modulo(-4, -5)).toBe(-4);
    expect(modulo(-3, -4)).toBe(-3);
  });
  test('positive and negative returns negative', () => {
    expect(modulo(3, -4)).toBe(-1);
    expect(modulo(1, -5)).toBe(-4);
    expect(modulo(6, -5)).toBe(-4);
  });
});

describe('ol.math.lerp', () => {
  test('correctly interpolated numbers', () => {
    expect(lerp(0, 0, 0)).toBe(0);
    expect(lerp(0, 1, 0)).toBe(0);
    expect(lerp(1, 11, 5)).toBe(51);
  });
  test('correctly interpolates floats', () => {
    expect(lerp(0, 1, 0.5)).toBe(0.5);
    expect(lerp(0.25, 0.75, 0.5)).toBe(0.5);
  });
});
