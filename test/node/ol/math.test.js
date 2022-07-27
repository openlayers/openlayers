import expect from '../expect.js';
import {
  ceil,
  clamp,
  floor,
  lerp,
  modulo,
  round,
  solveLinearSystem,
  toDegrees,
  toFixed,
  toRadians,
} from '../../../src/ol/math.js';

describe('ol/math.js', () => {
  describe('clamp', function () {
    it('returns the correct value at -Infinity', function () {
      expect(clamp(-Infinity, 10, 20)).to.eql(10);
    });

    it('returns the correct value at min', function () {
      expect(clamp(10, 10, 20)).to.eql(10);
    });

    it('returns the correct value at mid point', function () {
      expect(clamp(15, 10, 20)).to.eql(15);
    });

    it('returns the correct value at max', function () {
      expect(clamp(20, 10, 20)).to.eql(20);
    });

    it('returns the correct value at Infinity', function () {
      expect(clamp(Infinity, 10, 20)).to.eql(20);
    });
  });

  describe('solveLinearSystem', function () {
    it('calculates correctly', function () {
      const result = solveLinearSystem([
        [2, 1, 3, 1],
        [2, 6, 8, 3],
        [6, 8, 18, 5],
      ]);
      expect(result[0]).to.roughlyEqual(0.3, 1e-9);
      expect(result[1]).to.roughlyEqual(0.4, 1e-9);
      expect(result[2]).to.roughlyEqual(0, 1e-9);
    });

    it('can handle singular matrix', function () {
      const result = solveLinearSystem([
        [2, 1, 3, 1],
        [2, 6, 8, 3],
        [2, 1, 3, 1],
      ]);
      expect(result).to.be(null);
    });
  });

  describe('toDegrees', function () {
    it('returns the correct value at -π', function () {
      expect(toDegrees(-Math.PI)).to.be(-180);
    });
    it('returns the correct value at 0', function () {
      expect(toDegrees(0)).to.be(0);
    });
    it('returns the correct value at π', function () {
      expect(toDegrees(Math.PI)).to.be(180);
    });
  });

  describe('toRadians', function () {
    it('returns the correct value at -180', function () {
      expect(toRadians(-180)).to.be(-Math.PI);
    });
    it('returns the correct value at 0', function () {
      expect(toRadians(0)).to.be(0);
    });
    it('returns the correct value at 180', function () {
      expect(toRadians(180)).to.be(Math.PI);
    });
  });

  describe('modulo', function () {
    it('256 / 8 returns 0', function () {
      expect(modulo(256, 8)).to.be(0);
    });
    it('positive and positive returns a positive ', function () {
      expect(modulo(7, 8)).to.be(7);
    });
    it('same Dividend and Divisor returns 0', function () {
      expect(modulo(4, 4)).to.be(0);
    });
    it('negative and positive returns positive', function () {
      expect(modulo(-3, 4)).to.be(1);
    });
    it('negative and negative returns negative', function () {
      expect(modulo(-4, -5)).to.be(-4);
      expect(modulo(-3, -4)).to.be(-3);
    });
    it('positive and negative returns negative', function () {
      expect(modulo(3, -4)).to.be(-1);
      expect(modulo(1, -5)).to.be(-4);
      expect(modulo(6, -5)).to.be(-4);
    });
  });

  describe('lerp', function () {
    it('correctly interpolated numbers', function () {
      expect(lerp(0, 0, 0)).to.be(0);
      expect(lerp(0, 1, 0)).to.be(0);
      expect(lerp(1, 11, 5)).to.be(51);
    });
    it('correctly interpolates floats', function () {
      expect(lerp(0, 1, 0.5)).to.be(0.5);
      expect(lerp(0.25, 0.75, 0.5)).to.be(0.5);
    });
  });

  describe('toFixed', () => {
    it('returns a number with a limited number of decimals', () => {
      expect(toFixed(0.123456789, 3)).to.be(0.123);
    });

    it('rounds up', () => {
      expect(toFixed(0.123456789, 4)).to.be(0.1235);
    });

    const cases = [
      [1.23456789, 0],
      [1.23456789, 1],
      [1.23456789, 2],
      [1.23456789, 3],
      [1.23456789, 4],
      [1.23456789, 5],
      [1.23456789, 6],
      [1.23456789, 7],
      [1.23456789, 8],
      [1.23456789, 9],
      [1.23456789, 10],
    ];
    for (const c of cases) {
      it(`provides numeric equivalent of (${c[0]}).toFixed(${c[1]})`, () => {
        const string = c[0].toFixed(c[1]);
        const expected = parseFloat(string);
        const actual = toFixed(c[0], c[1]);
        expect(actual).to.be(expected);
      });
    }
  });

  describe('round', () => {
    const cases = [
      [1.23, 2, 1],
      [3.45, 1, 4],
      [3.45, 2, 3],
      [-3.45, 1, -3],
      [-3.45, 2, -3],
    ];

    for (const c of cases) {
      it(`works for round(${c[0]}, ${c[1]})`, () => {
        expect(round(c[0], c[1])).to.be(c[2]);
      });
    }
  });

  describe('floor', () => {
    const cases = [
      [3.999, 4, 3],
      [3.999, 2, 4],
      [-3.01, 2, -4],
      [-3.01, 1, -3],
    ];

    for (const c of cases) {
      it(`works for floor(${c[0]}, ${c[1]})`, () => {
        expect(floor(c[0], c[1])).to.be(c[2]);
      });
    }
  });

  describe('ceil', () => {
    const cases = [
      [4.001, 4, 5],
      [4.001, 2, 4],
      [-3.99, 3, -3],
      [-3.99, 1, -4],
    ];

    for (const c of cases) {
      it(`works for ceil(${c[0]}, ${c[1]})`, () => {
        expect(ceil(c[0], c[1])).to.be(c[2]);
      });
    }
  });
});
