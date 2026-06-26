import {assert} from 'chai';
import {
  ascending,
  binarySearch,
  equals,
  extend,
  isSorted,
  linearFindNearest,
  remove,
  reverseSubArray,
  stableSort,
} from '../../../src/ol/array.js';

describe('ol/array.js', function () {
  describe('binarySearch', function () {
    const insertionPoint = function (position) {
      return -(position + 1);
    };
    const revNumCompare = function (a, b) {
      return b - a;
    };

    describe('default comparison on array of String(s)', function () {
      const a = [
        '1000',
        '9',
        'AB',
        'ABC',
        'ABCABC',
        'ABD',
        'ABDA',
        'B',
        'B',
        'B',
        'C',
        'CA',
        'CC',
        'ZZZ',
        'ab',
        'abc',
        'abcabc',
        'abd',
        'abda',
        'b',
        'c',
        'ca',
        'cc',
        'zzz',
      ];

      it("should find '1000' at index 0", function () {
        assert.strictEqual(binarySearch(a, '1000'), 0);
      });
      it("should find 'zzz' at index " + (a.length - 1), function () {
        assert.strictEqual(binarySearch(a, 'zzz'), a.length - 1);
      });
      it("should find 'C' at index 10", function () {
        assert.strictEqual(binarySearch(a, 'C'), 10);
      });
      it("should find 'B' at index 7 || 8 || 9", function () {
        const pos = binarySearch(a, 'B');
        assert.isOk(pos == 7 || pos == 8 || pos == 9);
      });
      it("should not find '100'", function () {
        const pos = binarySearch(a, '100');
        assert.isOk(pos < 0);
      });
      it("should have an insertion point of 0 for '100'", function () {
        const pos = binarySearch(a, '100');
        assert.strictEqual(insertionPoint(pos), 0);
      });
      it("should not find 'zzz0'", function () {
        const pos = binarySearch(a, 'zzz0');
        assert.isOk(pos < 0);
      });
      it(
        'should have an insertion point of ' + a.length + " for 'zzz0'",
        function () {
          const pos = binarySearch(a, 'zzz0');
          assert.strictEqual(insertionPoint(pos), a.length);
        },
      );
      it("should not find 'BA'", function () {
        const pos = binarySearch(a, 'zzz0');
        assert.isOk(pos < 0);
      });
      it("should have an insertion point of 10 for 'BA'", function () {
        const pos = binarySearch(a, 'BA');
        assert.strictEqual(insertionPoint(pos), 10);
      });
    });

    describe('0 length array with default comparison', function () {
      const b = [];
      it("should not find 'a'", function () {
        assert.isOk(binarySearch(b, 'a') < 0);
      });
      it("should have an insertion point of 0 for 'a'", function () {
        const pos = binarySearch(b, 'a');
        assert.strictEqual(insertionPoint(pos), 0);
      });
    });

    describe('single element array with default lexiographical comparison', function () {
      const c = ['only item'];
      it("should find 'only item' at index 0", function () {
        assert.strictEqual(binarySearch(c, 'only item'), 0);
      });
      it("should not find 'a'", function () {
        assert.isOk(binarySearch(c, 'a') < 0);
      });
      it("should have an insertion point of 0 for 'a'", function () {
        const pos = binarySearch(c, 'a');
        assert.strictEqual(insertionPoint(pos), 0);
      });
      it("should not find 'z'", function () {
        assert.isOk(binarySearch(c, 'z') < 0);
      });
      it("should have an insertion point of 1 for 'z'", function () {
        const pos = binarySearch(c, 'z');
        assert.strictEqual(insertionPoint(pos), 1);
      });
    });

    describe('default comparison on array of Number(s)', function () {
      const d = [
        -897123.9, -321434.58758, -1321.3124, -324, -9, -3, 0, 0, 0, 0.31255, 5,
        142.88888708, 334, 342, 453, 54254,
      ];
      it('should find -897123.9 at index 0', function () {
        assert.strictEqual(binarySearch(d, -897123.9), 0);
      });
      it('should find 54254 at index ' + (d.length - 1), function () {
        assert.strictEqual(binarySearch(d, 54254), d.length - 1);
      });
      it('should find -3 at index 5', function () {
        assert.strictEqual(binarySearch(d, -3), 5);
      });
      it('should find 0 at index 6 || 7 || 8', function () {
        const pos = binarySearch(d, 0);
        assert.strictEqual(pos == 6 || pos == 7 || pos == 8, true);
      });
      it('should not find -900000', function () {
        const pos = binarySearch(d, -900000);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 0 for -900000', function () {
        const pos = binarySearch(d, -900000);
        assert.strictEqual(insertionPoint(pos), 0);
      });
      it('should not find 54255', function () {
        const pos = binarySearch(d, 54255);
        assert.strictEqual(pos < 0, true);
      });
      it(
        'should have an insertion point of ' + d.length + ' for 54255',
        function () {
          const pos = binarySearch(d, 54255);
          assert.strictEqual(insertionPoint(pos), d.length);
        },
      );
      it('should not find 1.1', function () {
        const pos = binarySearch(d, 1.1);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 10 for 1.1', function () {
        const pos = binarySearch(d, 1.1);
        assert.strictEqual(insertionPoint(pos), 10);
      });
    });

    describe('custom comparison function, which reverse orders numbers', function () {
      const e = [
        54254, 453, 342, 334, 142.88888708, 5, 0.31255, 0, 0, 0, -3, -9, -324,
        -1321.3124, -321434.58758, -897123.9,
      ];
      it('should find 54254 at index 0', function () {
        const pos = binarySearch(e, 54254, revNumCompare);
        assert.strictEqual(pos, 0);
      });
      it('should find -897123.9 at index ' + (e.length - 1), function () {
        const pos = binarySearch(e, -897123.9, revNumCompare);
        assert.strictEqual(pos, e.length - 1);
      });
      it('should find -3 at index 10', function () {
        const pos = binarySearch(e, -3, revNumCompare);
        assert.strictEqual(pos, 10);
      });
      it('should find 0 at index 7 || 8 || 9', function () {
        const pos = binarySearch(e, 0, revNumCompare);
        assert.strictEqual(pos == 7 || pos == 8 || pos == 9, true);
      });
      it('should not find 54254.1', function () {
        const pos = binarySearch(e, 54254.1, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 0 for 54254.1', function () {
        const pos = binarySearch(e, 54254.1, revNumCompare);
        assert.strictEqual(insertionPoint(pos), 0);
      });
      it('should not find -897124', function () {
        const pos = binarySearch(e, -897124, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it(
        'should have an insertion point of ' + e.length + ' for -897124',
        function () {
          const pos = binarySearch(e, -897124, revNumCompare);
          assert.strictEqual(insertionPoint(pos), e.length);
        },
      );
      it('should not find 1.1', function () {
        const pos = binarySearch(e, 1.1, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 0 for 1.1', function () {
        const pos = binarySearch(e, 1.1, revNumCompare);
        assert.strictEqual(insertionPoint(pos), 6);
      });
    });

    describe('0 length array with custom comparison function', function () {
      const f = [];
      it('should not find 0', function () {
        const pos = binarySearch(f, 0, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 0 for 0', function () {
        const pos = binarySearch(f, 0, revNumCompare);
        assert.strictEqual(insertionPoint(pos), 0);
      });
    });

    describe('single element array with custom comparison function', function () {
      const g = [1];
      it('should find 1 at index 0', function () {
        const pos = binarySearch(g, 1, revNumCompare);
        assert.strictEqual(pos, 0);
      });
      it('should not find 2', function () {
        const pos = binarySearch(g, 2, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 0 for 2', function () {
        const pos = binarySearch(g, 2, revNumCompare);
        assert.strictEqual(insertionPoint(pos), 0);
      });
      it('should not find 0', function () {
        const pos = binarySearch(g, 0, revNumCompare);
        assert.strictEqual(pos < 0, true);
      });
      it('should have an insertion point of 1 for 0', function () {
        const pos = binarySearch(g, 0, revNumCompare);
        assert.strictEqual(insertionPoint(pos), 1);
      });
    });

    describe('finding first index when multiple candidates', function () {
      it('should find the index of the first 0', function () {
        assert.strictEqual(binarySearch([0, 0, 1], 0), 0);
      });
      it('should find the index of the first 1', function () {
        assert.strictEqual(binarySearch([0, 1, 1], 1), 1);
      });
    });

    describe("Don't use Array#slice, Function#apply and Function#call", function () {
      const a = [1, 5, 7, 11, 13, 16, 19, 24, 28, 31, 33, 36, 40, 50, 52, 55];
      const calls = {
        'Array#slice': false,
        'Function#apply': false,
        'Function#call': false,
      };
      let origArraySlice;
      let origFunctionApply;
      let origFunctionCall;

      it('does not use potentially slow methods (default & custom compare)', function () {
        // Mockup (I failed to use sinon.spy and beforeEach-hooks)
        origArraySlice = Array.prototype.slice;
        origFunctionApply = Function.prototype.apply;
        origFunctionCall = Function.prototype.call;
        Array.prototype.slice = function () {
          calls['Array#slice'] = true;
        };
        Function.prototype.apply = function () {
          calls['Function#apply'] = true;
        };
        Function.prototype.call = function () {
          calls['Function#call'] = true;
        };

        // Now actually call and test the method twice
        binarySearch(a, 48);
        binarySearch(a, 13, function (a, b) {
          return a > b ? 1 : a < b ? -1 : 0;
        });

        // Restore mocked up methods
        Array.prototype.slice = origArraySlice;
        Function.prototype.apply = origFunctionApply;
        Function.prototype.call = origFunctionCall;

        assert.strictEqual(calls['Array#slice'], false);
        assert.strictEqual(calls['Function#apply'], false);
        assert.strictEqual(calls['Function#call'], false);
      });
    });

    describe('when items are not found', function () {
      const arr = [1, 2, 2, 2, 3, 5, 9];

      it('should return the index of where the item would go plus one, negated, if the item is not found', function () {
        assert.equal(binarySearch(arr, 4), -6);
      });
      it('should work even on empty arrays', function () {
        assert.equal(binarySearch([], 42), -1);
      });
      it('should work even on arrays of doubles', function () {
        assert.equal(binarySearch([0.0, 0.1, 0.2, 0.3, 0.4], 0.25), -4);
      });
    });
  });

  describe('equals', function () {
    it('returns true for [] == []', function () {
      assert.strictEqual(equals([], []), true);
    });
    it('returns true for [1] == [1]', function () {
      assert.strictEqual(equals([1], [1]), true);
    });
    it("returns true for ['1'] == ['1']", function () {
      assert.strictEqual(equals(['1'], ['1']), true);
    });
    it("returns false for [1] == ['1']", function () {
      assert.strictEqual(equals([1], ['1']), false);
    });
    it('returns true for [null] == [null]', function () {
      assert.strictEqual(equals([null], [null]), true);
    });
    it('returns false for [null] == [undefined]', function () {
      assert.strictEqual(equals([null], [undefined]), false);
    });
    it('returns true for [1, 2] == [1, 2]', function () {
      assert.strictEqual(equals([1, 2], [1, 2]), true);
    });
    it('returns false for [1, 2] == [2, 1]', function () {
      assert.strictEqual(equals([1, 2], [2, 1]), false);
    });
    it('returns false for [1, 2] == [1]', function () {
      assert.strictEqual(equals([1, 2], [1]), false);
    });
    it('returns false for [1] == [1, 2]', function () {
      assert.strictEqual(equals([1], [1, 2]), false);
    });
    it('returns false for [{}] == [{}]', function () {
      assert.strictEqual(equals([{}], [{}]), false);
    });
  });
  describe('extend', function () {
    it('extends an array in place with an array', function () {
      const a = [0, 1];
      extend(a, [2, 3]);
      assert.deepEqual(a, [0, 1, 2, 3]);
    });
    it('extends an array in place with a number', function () {
      const a = [0, 1];
      extend(a, 2);
      assert.deepEqual(a, [0, 1, 2]);
    });
    it('extends an array in place with a big array', function () {
      const a = [];
      let i = 250000; // original test has 1.000.000, but that was too slow
      const bigArray = Array(i);
      while (i--) {
        bigArray[i] = i;
      }
      extend(a, bigArray);
      assert.deepEqual(a, bigArray);
    });
  });

  describe('isSorted', function () {
    it('works with just an array as argument', function () {
      assert.strictEqual(isSorted([1, 2, 3]), true);
      assert.strictEqual(isSorted([1, 2, 2]), true);
      assert.strictEqual(isSorted([1, 2, 1]), false);
    });

    it('works with strict comparison without compare function', function () {
      assert.strictEqual(isSorted([1, 2, 3], null, true), true);
      assert.strictEqual(isSorted([1, 2, 2], null, true), false);
      assert.strictEqual(isSorted([1, 2, 1], null, true), false);
    });

    it('works with a compare function', function () {
      function compare(a, b) {
        return b - a;
      }
      assert.strictEqual(isSorted([1, 2, 3], compare), false);
      assert.strictEqual(isSorted([3, 2, 2], compare), true);
    });
  });

  describe('linearFindNearest', function () {
    it('returns expected value', function () {
      const arr = [1000, 500, 100];

      assert.deepEqual(linearFindNearest(arr, 10000, 0), 0);
      assert.deepEqual(linearFindNearest(arr, 10000, 1), 0);
      assert.deepEqual(linearFindNearest(arr, 10000, -1), 0);

      assert.deepEqual(linearFindNearest(arr, 1000, 0), 0);
      assert.deepEqual(linearFindNearest(arr, 1000, 1), 0);
      assert.deepEqual(linearFindNearest(arr, 1000, -1), 0);

      assert.deepEqual(linearFindNearest(arr, 999, -1), 1);

      assert.deepEqual(
        linearFindNearest(arr, 901, function (value, high, low) {
          return value - (low + (high - low) * 0.8);
        }),
        0,
      );

      assert.deepEqual(
        linearFindNearest(arr, 900, function (value, high, low) {
          return value - (low + (high - low) * 0.8);
        }),
        1,
      );

      assert.deepEqual(linearFindNearest(arr, 900, 0), 0);
      assert.deepEqual(linearFindNearest(arr, 900, 1), 0);
      assert.deepEqual(linearFindNearest(arr, 900, -1), 1);

      assert.deepEqual(linearFindNearest(arr, 751, 0), 0);

      assert.deepEqual(linearFindNearest(arr, 750, 0), 1);
      assert.deepEqual(linearFindNearest(arr, 750, 1), 0);
      assert.deepEqual(linearFindNearest(arr, 750, -1), 1);

      assert.deepEqual(
        linearFindNearest(arr, 551, function (value, high, low) {
          return value - (low + (high - low) * 0.1);
        }),
        0,
      );

      assert.deepEqual(
        linearFindNearest(arr, 550, function (value, high, low) {
          return value - (low + (high - low) * 0.1);
        }),
        1,
      );

      assert.deepEqual(linearFindNearest(arr, 550, 0), 1);
      assert.deepEqual(linearFindNearest(arr, 550, 1), 0);
      assert.deepEqual(linearFindNearest(arr, 550, -1), 1);

      assert.deepEqual(linearFindNearest(arr, 501, 1), 0);

      assert.deepEqual(linearFindNearest(arr, 500, 0), 1);
      assert.deepEqual(linearFindNearest(arr, 500, 1), 1);
      assert.deepEqual(linearFindNearest(arr, 500, -1), 1);

      assert.deepEqual(linearFindNearest(arr, 499, -1), 2);

      assert.deepEqual(
        linearFindNearest(arr, 451, function (value, high, low) {
          return value - (low + (high - low) * 0.875);
        }),
        1,
      );

      assert.deepEqual(
        linearFindNearest(arr, 450, function (value, high, low) {
          return value - (low + (high - low) * 0.875);
        }),
        2,
      );

      assert.deepEqual(linearFindNearest(arr, 450, 0), 1);
      assert.deepEqual(linearFindNearest(arr, 450, 1), 1);
      assert.deepEqual(linearFindNearest(arr, 450, -1), 2);

      assert.deepEqual(linearFindNearest(arr, 301, 0), 1);

      assert.deepEqual(linearFindNearest(arr, 300, 0), 2);
      assert.deepEqual(linearFindNearest(arr, 300, 1), 1);
      assert.deepEqual(linearFindNearest(arr, 300, -1), 2);

      assert.deepEqual(
        linearFindNearest(arr, 201, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        }),
        1,
      );

      assert.deepEqual(
        linearFindNearest(arr, 200, function (value, high, low) {
          return value - (low + (high - low) * 0.25);
        }),
        2,
      );

      assert.deepEqual(linearFindNearest(arr, 200, 0), 2);
      assert.deepEqual(linearFindNearest(arr, 200, 1), 1);
      assert.deepEqual(linearFindNearest(arr, 200, -1), 2);

      assert.deepEqual(linearFindNearest(arr, 101, 1), 1);

      assert.deepEqual(linearFindNearest(arr, 100, 0), 2);
      assert.deepEqual(linearFindNearest(arr, 100, 1), 2);
      assert.deepEqual(linearFindNearest(arr, 100, -1), 2);

      assert.deepEqual(linearFindNearest(arr, 50, 0), 2);
      assert.deepEqual(linearFindNearest(arr, 50, 1), 2);
      assert.deepEqual(linearFindNearest(arr, 50, -1), 2);
    });
  });

  describe('ascending', function () {
    it('sorts integers in ascending order', function () {
      const arr = [3000, 40, 200];
      arr.sort(ascending);
      assert.deepEqual(arr, [40, 200, 3000]);
    });

    it('sorts floats in ascending order', function () {
      const arr = [-2.0, -2.1, -1.9];
      arr.sort(ascending);
      assert.deepEqual(arr, [-2.1, -2.0, -1.9]);
    });

    it('sorts strings in ascending order', function () {
      const arr = ['bravo', 'alpha', 'delta'];
      arr.sort(ascending);
      assert.deepEqual(arr, ['alpha', 'bravo', 'delta']);
    });
  });

  describe('remove', function () {
    it('removes elements from an array', function () {
      const a = ['a', 'b', 'c', 'd'];
      remove(a, 'c');
      assert.deepEqual(a, ['a', 'b', 'd']);
      remove(a, 'x');
      assert.deepEqual(a, ['a', 'b', 'd']);
    });
  });

  describe('reverseSubArray', function () {
    it('returns expected value', function () {
      let arr;
      const expected = [1, 2, 3, 4, 5, 6];

      arr = [1, 5, 4, 3, 2, 6];
      reverseSubArray(arr, 1, 4);
      assert.deepEqual(arr, expected);

      arr = [3, 2, 1, 4, 5, 6];
      reverseSubArray(arr, 0, 2);
      assert.deepEqual(arr, expected);

      arr = [1, 2, 3, 6, 5, 4];
      reverseSubArray(arr, 3, 5);
      assert.deepEqual(arr, expected);

      arr = [6, 5, 4, 3, 2, 1];
      reverseSubArray(arr, 0, 5);
      assert.deepEqual(arr, expected);
    });
  });

  describe('stableSort', function () {
    let arr, wantedSortedValues;

    beforeEach(function () {
      arr = [
        {key: 3, val: 'a'},
        {key: 2, val: 'b'},
        {key: 3, val: 'c'},
        {key: 4, val: 'd'},
        {key: 3, val: 'e'},
      ];
      wantedSortedValues = ['b', 'a', 'c', 'e', 'd'];
    });

    it('works on an array with custom comparison function', function () {
      function comparisonFn(obj1, obj2) {
        return obj1.key - obj2.key;
      }
      stableSort(arr, comparisonFn);
      const sortedValues = [];
      for (let i = 0; i < arr.length; i++) {
        sortedValues.push(arr[i].val);
      }
      assert.deepEqual(wantedSortedValues, sortedValues);
    });
  });
});
