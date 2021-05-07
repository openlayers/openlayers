import expect from 'expect.js';

/**
 * Assert value is within some tolerance of a number.
 * @param {number} n Number.
 * @param {number} tol Tolerance.
 * @return {expect.Assertion} The assertion.
 */
expect.Assertion.prototype.roughlyEqual = function (n, tol) {
  this.assert(
    Math.abs(this.obj - n) <= tol,
    function () {
      return (
        'expected ' +
        expect.stringify(this.obj) +
        ' to be within ' +
        tol +
        ' of ' +
        n
      );
    },
    function () {
      return (
        'expected ' +
        expect.stringify(this.obj) +
        ' not to be within ' +
        tol +
        ' of ' +
        n
      );
    }
  );
  return this;
};

export default expect;
